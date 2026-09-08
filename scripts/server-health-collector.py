#!/usr/bin/env python3
"""Collect a small, public-safe snapshot of host health metrics."""

from __future__ import annotations

import datetime as dt
import glob
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Optional


OUTPUT_DIRECTORY = Path("/srv/www/portfolio/data")
OUTPUT_FILE = OUTPUT_DIRECTORY / "server-status.json"
ROOM_CLIMATE_FILE = OUTPUT_DIRECTORY / "room-climate.json"

def percentage(used: int | float, total: int | float) -> Optional[float]:
    if total <= 0:
        return None
    return round((used / total) * 100.0, 1)


def read_cpu_counters() -> tuple[int, int]:
    with open("/proc/stat", "r", encoding="ascii") as source:
        fields = source.readline().split()

    if len(fields) < 6 or fields[0] != "cpu":
        raise ValueError("invalid CPU counters")

    # guest and guest_nice are already included in user and nice, respectively.
    counters = [int(value) for value in fields[1:9]]
    if len(counters) < 5 or any(value < 0 for value in counters):
        raise ValueError("invalid CPU counters")

    idle = counters[3] + counters[4]
    return idle, sum(counters)


def collect_cpu_usage() -> Optional[float]:
    try:
        idle_before, total_before = read_cpu_counters()
        time.sleep(0.25)
        idle_after, total_after = read_cpu_counters()
        idle_delta = idle_after - idle_before
        total_delta = total_after - total_before
        if total_delta <= 0 or idle_delta < 0 or idle_delta > total_delta:
            return None
        return round((1.0 - idle_delta / total_delta) * 100.0, 1)
    except (OSError, ValueError, IndexError):
        return None


def read_millidegrees(path: Path) -> Optional[float]:
    try:
        celsius = int(path.read_text(encoding="ascii").strip()) / 1000.0
    except (OSError, ValueError):
        return None

    # Broad enough for valid package readings, while rejecting broken sensors.
    if not -20.0 <= celsius <= 125.0:
        return None
    return round(celsius, 1)


def collect_cpu_temperature() -> Optional[float]:
    for hwmon_name in sorted(glob.glob("/sys/class/hwmon/hwmon*/name")):
        name_path = Path(hwmon_name)
        try:
            if name_path.read_text(encoding="ascii").strip() != "coretemp":
                continue
        except OSError:
            continue

        for label_name in sorted(glob.glob(str(name_path.parent / "temp*_label"))):
            label_path = Path(label_name)
            try:
                if label_path.read_text(encoding="ascii").strip() != "Package id 0":
                    continue
            except OSError:
                continue

            value = read_millidegrees(
                label_path.with_name(label_path.name.removesuffix("_label") + "_input")
            )
            if value is not None:
                return value

    for type_name in sorted(glob.glob("/sys/class/thermal/thermal_zone*/type")):
        type_path = Path(type_name)
        try:
            if type_path.read_text(encoding="ascii").strip() != "x86_pkg_temp":
                continue
        except OSError:
            continue

        value = read_millidegrees(type_path.with_name("temp"))
        if value is not None:
            return value

    return None


def collect_memory() -> Optional[dict[str, int | float]]:
    try:
        values: dict[str, int] = {}
        with open("/proc/meminfo", "r", encoding="ascii") as source:
            for line in source:
                key, separator, remainder = line.partition(":")
                if separator and key in {"MemTotal", "MemAvailable"}:
                    parts = remainder.split()
                    if len(parts) != 2 or parts[1] != "kB":
                        raise ValueError("invalid memory value")
                    values[key] = int(parts[0]) * 1024

        total = values["MemTotal"]
        available = values["MemAvailable"]
        if total <= 0 or available < 0 or available > total:
            return None
        used = total - available
        return {
            "used_bytes": used,
            "total_bytes": total,
            "usage_percent": percentage(used, total),
        }
    except (OSError, ValueError, KeyError):
        return None


def collect_disk() -> Optional[dict[str, int | float]]:
    try:
        filesystem = os.statvfs("/")
        fragment_size = filesystem.f_frsize or filesystem.f_bsize
        total = filesystem.f_blocks * fragment_size
        available = filesystem.f_bavail * fragment_size
        if total <= 0 or available < 0 or available > total:
            return None
        used = total - available
        return {
            "used_bytes": used,
            "total_bytes": total,
            "usage_percent": percentage(used, total),
        }
    except OSError:
        return None


def collect_uptime() -> Optional[int]:
    try:
        value = float(Path("/proc/uptime").read_text(encoding="ascii").split()[0])
        if value < 0:
            return None
        return int(value)
    except (OSError, ValueError, IndexError):
        return None


def collect_load_average() -> Optional[dict[str, float]]:
    try:
        one, five, fifteen = os.getloadavg()
        if any(value < 0 for value in (one, five, fifteen)):
            return None
        return {
            "1m": round(one, 2),
            "5m": round(five, 2),
            "15m": round(fifteen, 2),
        }
    except (OSError, AttributeError):
        return None

def collect_room_climate() -> dict[str, object]:
    try:
        data = json.loads(ROOM_CLIMATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {
            "temperature_celsius": None,
            "humidity_percent": None,
            "battery": None,
            "updated_at": None,
        }

    temperature = data.get("temperature_celsius")
    humidity = data.get("humidity_percent")
    battery = data.get("battery")
    updated_at = data.get("updated_at")

    if not isinstance(temperature, (int, float)):
        temperature = None

    if not isinstance(humidity, (int, float)):
        humidity = None

    if not isinstance(battery, str):
        battery = None

    if not isinstance(updated_at, str):
        updated_at = None

    return {
        "temperature_celsius": temperature,
        "humidity_percent": humidity,
        "battery": battery,
        "updated_at": updated_at,
    }

def collect_snapshot() -> dict[str, object]:
    cpu_usage = collect_cpu_usage()
    memory = collect_memory()
    disk = collect_disk()
    uptime = collect_uptime()
    load_average = collect_load_average()

    essential_metrics_available = all(
        value is not None
        for value in (cpu_usage, memory, disk, uptime, load_average)
    )

    return {
        "schema_version": 1,
        "generated_at": dt.datetime.now(dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "status": "ok" if essential_metrics_available else "degraded",
        "cpu": {
            "usage_percent": cpu_usage,
            "temperature_celsius": collect_cpu_temperature(),
        },
        "memory": memory
        if memory is not None
        else {"used_bytes": None, "total_bytes": None, "usage_percent": None},
        "disk": disk
        if disk is not None
        else {"used_bytes": None, "total_bytes": None, "usage_percent": None},
        "uptime_seconds": uptime,
        "load_average": load_average
        if load_average is not None
        else {"1m": None, "5m": None, "15m": None},
	"room": collect_room_climate(),
        "containers": {"running": None},
    }


def write_snapshot(snapshot: dict[str, object]) -> None:
    OUTPUT_DIRECTORY.mkdir(mode=0o755, parents=True, exist_ok=True)
    temporary_name: Optional[str] = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=OUTPUT_DIRECTORY,
            prefix=".server-status.",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary_name = temporary.name
            json.dump(snapshot, temporary, indent=2, allow_nan=False)
            temporary.write("\n")
            temporary.flush()
            os.fsync(temporary.fileno())
            os.fchmod(temporary.fileno(), 0o644)

        os.replace(temporary_name, OUTPUT_FILE)
        temporary_name = None

        directory_fd = os.open(OUTPUT_DIRECTORY, os.O_RDONLY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        if temporary_name is not None:
            try:
                os.unlink(temporary_name)
            except FileNotFoundError:
                pass


def main() -> None:
    write_snapshot(collect_snapshot())


if __name__ == "__main__":
    main()
