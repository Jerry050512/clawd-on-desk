"use strict";

/**
 * timer-runtime.js
 * Manages timers and alarms for Clawd.
 */

module.exports = function createTimerRuntime(ctx) {
  const timers = new Set();

  function addTimer(minutes) {
    if (typeof minutes !== "number" || minutes <= 0) return null;
    const ms = minutes * 60 * 1000;
    const timerId = setTimeout(() => {
      timers.delete(timerId);
      if (typeof ctx.onReminder === "function") {
        ctx.onReminder({ type: "timer", minutes });
      }
    }, ms);
    timers.add(timerId);
    return timerId;
  }

  function addAlarm(timeStr) {
    if (typeof timeStr !== "string") return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
      return null;
    }

    const now = new Date();
    const target = new Date(now.getTime());
    target.setHours(hours, minutes, 0, 0);

    // If target time is within 1 minute from now AND the seconds/ms part of now
    // makes target < now, it might be intended for today but already slightly passed.
    // If it's more than 1 minute ago, definitely tomorrow.
    if (target <= now && (now - target) > 60000) {
      target.setDate(target.getDate() + 1);
    } else if (target <= now) {
      // Just passed or same minute, trigger in 1 second for safety or 0
      target.setTime(now.getTime() + 1000);
    }

    const ms = target - now;
    const timerId = setTimeout(() => {
      timers.delete(timerId);
      if (typeof ctx.onReminder === "function") {
        ctx.onReminder({ type: "alarm", time: timeStr });
      }
    }, ms);
    timers.add(timerId);
    return timerId;
  }

  function cleanup() {
    for (const timerId of timers) {
      clearTimeout(timerId);
    }
    timers.clear();
  }

  return {
    addTimer,
    addAlarm,
    cleanup,
  };
};
