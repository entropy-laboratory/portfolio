"use strict";

(() => {
  const REFRESH_INTERVAL_MS = 15_000;
  const STALE_AFTER_MS = 45_000;
  const endpoint = "/data/server-status.json";

  function initServerHealth() {
    if (window.__portfolioServerHealthInitialized) return;

    const healthState = document.querySelector("[data-health-state]");
    if (!healthState) return;

    window.__portfolioServerHealthInitialized = true;

    const statusText = document.querySelector("[data-health-status]");
    const updatedTime = document.querySelector("[data-health-updated]");
    let requestInProgress = false;

  const metric = (name) => document.querySelector(`[data-metric="${name}"]`);
  const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
  const displayNumber = (value, decimals = 1) => isNumber(value) ? value.toFixed(decimals) : "—";

  function setPercentage(name, value) {
    metric(name).textContent = displayNumber(value);
    const unit = document.querySelector(`[data-unit="${name}"]`);
    if (unit) unit.hidden = !isNumber(value);
  }

  function displayGiB(used, total) {
    if (!isNumber(used) || !isNumber(total) || used < 0 || total <= 0) return "—";
    const gibibyte = 1024 ** 3;
    return `${(used / gibibyte).toFixed(1)} / ${(total / gibibyte).toFixed(1)} GiB`;
  }

  function displayUptime(seconds) {
    if (!isNumber(seconds) || seconds < 0) return "—";

    const totalMinutes = Math.floor(seconds / 60);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];

    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(" ");
  }

  function setProgress(name, value) {
    const progress = document.querySelector(`[data-progress="${name}"]`);
    if (!progress) return;

    if (!isNumber(value)) {
      progress.removeAttribute("aria-valuenow");
      progress.querySelector("span").style.width = "0%";
      return;
    }

    const boundedValue = Math.min(100, Math.max(0, value));
    progress.setAttribute("aria-valuenow", boundedValue.toFixed(1));
    progress.querySelector("span").style.width = `${boundedValue}%`;
  }

  function setState(state, label) {
    healthState.dataset.healthState = state;
    statusText.textContent = label;
  }

  function updateMetrics(data) {
    const cpu = data?.cpu;
    const memory = data?.memory;
    const disk = data?.disk;
    const load = data?.load_average;

    setPercentage("cpu-usage", cpu?.usage_percent);
    metric("cpu-temperature").textContent = isNumber(cpu?.temperature_celsius)
      ? `${cpu.temperature_celsius.toFixed(1)} °C`
      : "—";
    setPercentage("memory-percent", memory?.usage_percent);
    metric("memory-size").textContent = displayGiB(memory?.used_bytes, memory?.total_bytes);
    setPercentage("disk-percent", disk?.usage_percent);
    metric("disk-size").textContent = displayGiB(disk?.used_bytes, disk?.total_bytes);
    metric("uptime").textContent = displayUptime(data?.uptime_seconds);
    metric("load-1").textContent = displayNumber(load?.["1m"], 2);
    metric("load-5").textContent = displayNumber(load?.["5m"], 2);
    metric("load-15").textContent = displayNumber(load?.["15m"], 2);
    setProgress("memory", memory?.usage_percent);
    setProgress("disk", disk?.usage_percent);
  }

  function updateFreshness(data) {
    const generatedAt = typeof data?.generated_at === "string"
      ? new Date(data.generated_at)
      : null;
    const hasValidTimestamp = generatedAt && !Number.isNaN(generatedAt.getTime());

    if (hasValidTimestamp) {
      updatedTime.dateTime = generatedAt.toISOString();
      updatedTime.textContent = generatedAt.toLocaleString();
    } else {
      updatedTime.removeAttribute("datetime");
      updatedTime.textContent = "—";
    }

    if (!hasValidTimestamp || Date.now() - generatedAt.getTime() > STALE_AFTER_MS) {
      setState("stale", "Stale");
    } else if (data?.status === "ok") {
      setState("ok", "OK");
    } else {
      setState("degraded", "Degraded");
    }
  }

  async function refreshHealth() {
    if (requestInProgress) return;
    requestInProgress = true;

    try {
      const separator = endpoint.includes("?") ? "&" : "?";
      const response = await fetch(`${endpoint}${separator}t=${Date.now()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error("Health data unavailable");
      const data = await response.json();
      updateMetrics(data);
      updateFreshness(data);
    } catch {
      setState("offline", "Offline");
    } finally {
      requestInProgress = false;
    }
  }

    refreshHealth();
    window.setInterval(refreshHealth, REFRESH_INTERVAL_MS);
  }

  window.initServerHealth = initServerHealth;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initServerHealth, { once: true });
  } else {
    initServerHealth();
  }
})();
