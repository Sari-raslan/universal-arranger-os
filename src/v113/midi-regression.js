export function normalizeMidiEvent(event) {
  if (!event || typeof event !== "object") {
    throw new TypeError("MIDI event must be an object");
  }

  const status = Number(event.status);
  const data1 = Number(event.data1 ?? 0);
  const data2 = Number(event.data2 ?? 0);
  const timestamp = Number(event.timestamp ?? 0);

  for (const [name, value] of Object.entries({ status, data1, data2 })) {
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      throw new RangeError(`${name} must be an integer between 0 and 255`);
    }
  }

  if (!Number.isFinite(timestamp) || timestamp < 0) {
    throw new RangeError("timestamp must be a non-negative number");
  }

  return Object.freeze({ status, data1, data2, timestamp });
}

export function compareMidiSequences(expected = [], actual = [], toleranceMs = 3) {
  if (expected.length !== actual.length) {
    return {
      pass: false,
      reason: "length-mismatch",
      expectedLength: expected.length,
      actualLength: actual.length,
    };
  }

  for (let index = 0; index < expected.length; index += 1) {
    const left = normalizeMidiEvent(expected[index]);
    const right = normalizeMidiEvent(actual[index]);

    if (
      left.status !== right.status ||
      left.data1 !== right.data1 ||
      left.data2 !== right.data2
    ) {
      return { pass: false, reason: "data-mismatch", index, expected: left, actual: right };
    }

    if (Math.abs(left.timestamp - right.timestamp) > toleranceMs) {
      return { pass: false, reason: "timing-mismatch", index, expected: left, actual: right };
    }
  }

  return { pass: true, reason: "match" };
}