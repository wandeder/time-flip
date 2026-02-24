const STORAGE_KEYS = {
  timezone: 'timezoneOffset',
  history: 'history'
};

const HISTORY_LIMIT = 10;
const TZ_MIN = -12;
const TZ_MAX = 14;

const state = {
  timezoneOffset: 0,
  history: []
};

const elements = {
  timezone: document.getElementById('timezone'),
  tsInput: document.getElementById('ts-input'),
  tsConvert: document.getElementById('ts-convert'),
  tsError: document.getElementById('ts-error'),
  tsResult: document.getElementById('ts-result'),
  dateInput: document.getElementById('date-input'),
  dateConvert: document.getElementById('date-convert'),
  dateError: document.getElementById('date-error'),
  dateSeconds: document.getElementById('date-seconds'),
  dateMilliseconds: document.getElementById('date-milliseconds'),
  history: document.getElementById('history'),
  clearHistory: document.getElementById('clear-history')
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatTimezoneLabel(offset) {
  if (offset === 0) {
    return 'UTC+0';
  }
  const sign = offset > 0 ? '+' : '';
  return `UTC${sign}${offset}`;
}

function fillTimezoneOptions() {
  for (let offset = TZ_MIN; offset <= TZ_MAX; offset += 1) {
    const option = document.createElement('option');
    option.value = String(offset);
    option.textContent = formatTimezoneLabel(offset);
    elements.timezone.appendChild(option);
  }
}

function formatDateWithOffset(ms, offset) {
  const shifted = new Date(ms + offset * 3600000);
  const year = shifted.getUTCFullYear();
  const month = pad(shifted.getUTCMonth() + 1);
  const day = pad(shifted.getUTCDate());
  const hours = pad(shifted.getUTCHours());
  const minutes = pad(shifted.getUTCMinutes());
  const seconds = pad(shifted.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function parseTimestampInput(raw) {
  const value = raw.trim();
  if (!value) {
    return { error: 'Enter timestamp value.' };
  }
  if (!/^-?\d+$/.test(value)) {
    return { error: 'Timestamp must be an integer.' };
  }
  const isSeconds = value.replace('-', '').length <= 10;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return { error: 'Timestamp is out of range.' };
  }
  const ms = isSeconds ? numeric * 1000 : numeric;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    return { error: 'Timestamp is invalid.' };
  }
  return { value, ms };
}

function parseDatetimeLocal(raw) {
  if (!raw) {
    return { error: 'Select date and time.' };
  }
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return { error: 'Date format is invalid.' };
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || '0');
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
    return { error: 'Date value is invalid.' };
  }
  const utcMs = Date.UTC(year, month - 1, day, hour - state.timezoneOffset, minute, second);
  const verify = new Date(utcMs + state.timezoneOffset * 3600000);
  if (
    verify.getUTCFullYear() !== year ||
    verify.getUTCMonth() + 1 !== month ||
    verify.getUTCDate() !== day ||
    verify.getUTCHours() !== hour ||
    verify.getUTCMinutes() !== minute ||
    verify.getUTCSeconds() !== second
  ) {
    return { error: 'Date value is invalid.' };
  }
  return { utcMs };
}

function setTsError(text) {
  elements.tsError.textContent = text;
}

function setDateError(text) {
  elements.dateError.textContent = text;
}

function updateTsResult(text) {
  elements.tsResult.textContent = text;
}

function updateDateResult(seconds, milliseconds) {
  elements.dateSeconds.textContent = seconds;
  elements.dateMilliseconds.textContent = milliseconds;
}

function addHistory(record) {
  const next = [record, ...state.history].slice(0, HISTORY_LIMIT);
  state.history = next;
  chrome.storage.local.set({ [STORAGE_KEYS.history]: next });
  renderHistory();
}

function convertTsToDate(saveHistory = true) {
  const parsed = parseTimestampInput(elements.tsInput.value);
  if (parsed.error) {
    setTsError(parsed.error);
    updateTsResult('-');
    return;
  }
  const result = `${formatDateWithOffset(parsed.ms, state.timezoneOffset)} (${formatTimezoneLabel(state.timezoneOffset)})`;
  setTsError('');
  updateTsResult(result);

  if (saveHistory) {
    addHistory({
      type: 'ts_to_date',
      input: parsed.value,
      result,
      timestamp: Date.now()
    });
  }
}

function convertDateToTs(saveHistory = true) {
  const parsed = parseDatetimeLocal(elements.dateInput.value);
  if (parsed.error) {
    setDateError(parsed.error);
    updateDateResult('-', '-');
    return;
  }
  const seconds = String(Math.floor(parsed.utcMs / 1000));
  const milliseconds = String(parsed.utcMs);
  setDateError('');
  updateDateResult(seconds, milliseconds);

  if (saveHistory) {
    addHistory({
      type: 'date_to_ts',
      input: elements.dateInput.value,
      result: `${seconds} | ${milliseconds}`,
      timestamp: Date.now()
    });
  }
}

function renderHistory() {
  elements.history.textContent = '';

  if (!state.history.length) {
    const empty = document.createElement('p');
    empty.className = 'history-empty';
    empty.textContent = 'No recent operations.';
    const holder = document.createElement('li');
    holder.appendChild(empty);
    elements.history.appendChild(holder);
    return;
  }

  state.history.forEach((item) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';

    const type = document.createElement('span');
    type.className = 'history-type';
    type.textContent = item.type === 'ts_to_date' ? 'TS → Date' : 'Date → TS';

    const input = document.createElement('span');
    input.className = 'history-input';
    input.textContent = `In: ${item.input}`;

    const result = document.createElement('span');
    result.className = 'history-result';
    result.textContent = `Out: ${item.result}`;

    button.appendChild(type);
    button.appendChild(input);
    button.appendChild(result);

    button.addEventListener('click', () => {
      if (item.type === 'ts_to_date') {
        elements.tsInput.value = item.input;
        convertTsToDate(false);
        elements.tsInput.focus();
      } else {
        elements.dateInput.value = item.input;
        convertDateToTs(false);
        elements.dateInput.focus();
      }
    });

    li.appendChild(button);
    elements.history.appendChild(li);
  });
}

function clearHistory() {
  state.history = [];
  chrome.storage.local.set({ [STORAGE_KEYS.history]: [] });
  renderHistory();
}

function applyTimezone(offset) {
  state.timezoneOffset = offset;
  chrome.storage.local.set({ [STORAGE_KEYS.timezone]: offset });

  if (elements.tsInput.value.trim()) {
    convertTsToDate(false);
  }

  if (elements.dateInput.value) {
    convertDateToTs(false);
  }
}

function handleEnter(event) {
  if (event.key !== 'Enter') {
    return;
  }
  if (event.currentTarget === elements.tsInput) {
    convertTsToDate();
  }
  if (event.currentTarget === elements.dateInput) {
    convertDateToTs();
  }
}

function bindEvents() {
  elements.tsConvert.addEventListener('click', () => convertTsToDate());
  elements.dateConvert.addEventListener('click', () => convertDateToTs());
  elements.clearHistory.addEventListener('click', clearHistory);
  elements.timezone.addEventListener('change', (event) => {
    const offset = Number(event.target.value);
    if (!Number.isInteger(offset)) {
      return;
    }
    applyTimezone(offset);
  });

  elements.tsInput.addEventListener('keydown', handleEnter);
  elements.dateInput.addEventListener('keydown', handleEnter);
  elements.tsInput.addEventListener('input', () => {
    if (!elements.tsInput.value.trim()) {
      setTsError('');
      updateTsResult('-');
      return;
    }
    convertTsToDate(false);
  });

  elements.dateInput.addEventListener('input', () => {
    if (!elements.dateInput.value) {
      setDateError('');
      updateDateResult('-', '-');
      return;
    }
    convertDateToTs(false);
  });
}

function loadState() {
  chrome.storage.local.get([STORAGE_KEYS.timezone, STORAGE_KEYS.history], (data) => {
    const savedOffset = Number(data[STORAGE_KEYS.timezone]);
    if (Number.isInteger(savedOffset) && savedOffset >= TZ_MIN && savedOffset <= TZ_MAX) {
      state.timezoneOffset = savedOffset;
    }

    const savedHistory = Array.isArray(data[STORAGE_KEYS.history]) ? data[STORAGE_KEYS.history] : [];
    state.history = savedHistory.slice(0, HISTORY_LIMIT).filter((item) => {
      return item && (item.type === 'ts_to_date' || item.type === 'date_to_ts')
        && typeof item.input === 'string'
        && typeof item.result === 'string'
        && Number.isFinite(Number(item.timestamp));
    });

    elements.timezone.value = String(state.timezoneOffset);
    renderHistory();
    elements.tsInput.focus();
  });
}

function init() {
  fillTimezoneOptions();
  bindEvents();
  loadState();
}

init();
