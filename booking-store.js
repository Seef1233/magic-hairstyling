(function (window) {
  'use strict';

  const KEYS = {
    bookings: 'magic-hairstyling-bookings',
    settings: 'magic-hairstyling-settings'
  };

  const DEFAULT_HOURS = {
    0: ['12:00', '18:00'],
    1: ['11:00', '19:00'],
    2: ['11:00', '19:00'],
    3: ['09:00', '20:00'],
    4: ['09:00', '21:00'],
    5: ['09:00', '20:00'],
    6: ['09:00', '18:00']
  };

  const DEFAULT_SETTINGS = {
    adminPin: '1234',
    weeklyHours: DEFAULT_HOURS,
    blockedDates: [],
    blockedSlots: []
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uiMessage(key, fallback) {
    try {
      if (window.MagicI18n && typeof window.MagicI18n.t === 'function') {
        const translated = window.MagicI18n.t('bookingStore.' + key, null, fallback);
        if (translated) return translated;
      }
    } catch (error) {
      /* fall through to fallback */
    }
    return fallback;
  }

  function toMin(time) {
    const [h, m] = String(time).split(':').map(Number);
    return (h * 60) + m;
  }

  function toTime(minutes) {
    return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
  }

  function uid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (error) {
      return clone(fallback);
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeSettings(settings) {
    const merged = Object.assign({}, clone(DEFAULT_SETTINGS), settings || {});
    merged.weeklyHours = Object.assign({}, clone(DEFAULT_HOURS), (settings && settings.weeklyHours) || {});
    merged.blockedDates = Array.isArray(merged.blockedDates) ? merged.blockedDates : [];
    merged.blockedSlots = Array.isArray(merged.blockedSlots) ? merged.blockedSlots : [];
    return merged;
  }

  function getSettings() {
    return normalizeSettings(readJson(KEYS.settings, DEFAULT_SETTINGS));
  }

  function saveSettings(settings) {
    const normalized = normalizeSettings(settings);
    writeJson(KEYS.settings, normalized);
    return normalized;
  }

  function getWeeklyHours(day) {
    const settings = getSettings();
    return settings.weeklyHours[String(day)] || null;
  }

  function getBookings() {
    const list = readJson(KEYS.bookings, []);
    return Array.isArray(list) ? list.map(normalizeBooking) : [];
  }

  function saveBookings(bookings) {
    writeJson(KEYS.bookings, bookings.map(normalizeBooking));
  }

  function normalizeBooking(booking) {
    const normalized = Object.assign({
      id: uid('bk'),
      code: 'MH-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      status: 'pending',
      duration: 30,
      price: '',
      email: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, booking || {});

    normalized.duration = Number(normalized.duration) || 30;
    normalized.date = normalized.date || '';
    normalized.time = normalized.time || '';
    normalized.name = (normalized.name || '').trim();
    normalized.phone = (normalized.phone || '').trim();
    normalized.service = (normalized.service || '').trim();
    normalized.price = (normalized.price || '').trim();
    normalized.email = (normalized.email || '').trim();
    normalized.notes = (normalized.notes || '').trim();
    normalized.status = normalized.status || 'pending';
    return normalized;
  }

  function isBlockedDate(date) {
    return getSettings().blockedDates.includes(date);
  }

  function getBlockedSlots(date) {
    return getSettings().blockedSlots.filter(slot => slot.date === date);
  }

  function overlaps(startA, durationA, startB, durationB) {
    const a1 = toMin(startA);
    const a2 = a1 + durationA;
    const b1 = toMin(startB);
    const b2 = b1 + durationB;
    return a1 < b2 && b1 < a2;
  }

  function getActiveBookingsForDate(date, ignoreId) {
    return getBookings().filter(booking => {
      if (booking.date !== date) return false;
      if (ignoreId && booking.id === ignoreId) return false;
      return booking.status !== 'rejected' && booking.status !== 'cancelled';
    });
  }

  function getConflicts(date, time, duration, ignoreId) {
    const bookingConflicts = getActiveBookingsForDate(date, ignoreId).filter(booking =>
      overlaps(time, duration, booking.time, Number(booking.duration) || 30)
    ).map(booking => ({ type: 'booking', booking: booking }));

    const blockedConflicts = getBlockedSlots(date).filter(slot =>
      overlaps(time, duration, slot.time, Number(slot.duration) || 30)
    ).map(slot => ({ type: 'blocked', slot: slot }));

    return bookingConflicts.concat(blockedConflicts);
  }

  function ensureSlotAvailable(date, time, duration, ignoreId) {
    if (!date || !time) {
      throw new Error(uiMessage('chooseDateTime', 'Kies eerst een datum en tijd.'));
    }
    if (isBlockedDate(date)) {
      throw new Error(uiMessage('closedDay', 'Deze dag is gesloten voor nieuwe afspraken.'));
    }

    const conflicts = getConflicts(date, time, duration, ignoreId);
    if (conflicts.length) {
      const blocked = conflicts.find(item => item.type === 'blocked');
      if (blocked) {
        throw new Error(blocked.slot.reason || uiMessage('blockedSlot', 'Dit tijdslot is door de salon geblokkeerd.'));
      }
      throw new Error(uiMessage('slotTaken', 'Dit tijdslot is al bezet. Kies een ander tijdstip.'));
    }
  }

  function createBooking(data) {
    const booking = normalizeBooking(Object.assign({}, data, {
      id: uid('bk'),
      code: data.code || ('MH-' + Math.random().toString(36).slice(2, 8).toUpperCase()),
      status: data.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    ensureSlotAvailable(booking.date, booking.time, booking.duration);
    const bookings = getBookings();
    bookings.push(booking);
    saveBookings(bookings);
    return booking;
  }

  function updateBooking(id, updates) {
    const bookings = getBookings();
    const index = bookings.findIndex(item => item.id === id);
    if (index === -1) throw new Error(uiMessage('bookingNotFound', 'Afspraak niet gevonden.'));

    const merged = normalizeBooking(Object.assign({}, bookings[index], updates || {}, {
      id: bookings[index].id,
      code: bookings[index].code,
      createdAt: bookings[index].createdAt,
      updatedAt: new Date().toISOString()
    }));

    if (merged.status !== 'rejected' && merged.status !== 'cancelled') {
      ensureSlotAvailable(merged.date, merged.time, merged.duration, id);
    }

    bookings[index] = merged;
    saveBookings(bookings);
    return merged;
  }

  function setBookingStatus(id, status) {
    return updateBooking(id, { status: status });
  }

  function blockDate(date) {
    const settings = getSettings();
    if (!settings.blockedDates.includes(date)) settings.blockedDates.push(date);
    settings.blockedDates.sort();
    return saveSettings(settings);
  }

  function unblockDate(date) {
    const settings = getSettings();
    settings.blockedDates = settings.blockedDates.filter(item => item !== date);
    return saveSettings(settings);
  }

  function blockSlot(data) {
    const settings = getSettings();
    const slot = {
      id: uid('slot'),
      date: data.date,
      time: data.time,
      duration: Number(data.duration) || 30,
      reason: (data.reason || 'Tijdslot gesloten').trim()
    };
    settings.blockedSlots.push(slot);
    settings.blockedSlots.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return saveSettings(settings);
  }

  function unblockSlot(id) {
    const settings = getSettings();
    settings.blockedSlots = settings.blockedSlots.filter(slot => slot.id !== id);
    return saveSettings(settings);
  }

  function updateWeeklyHours(day, hours) {
    const settings = getSettings();
    settings.weeklyHours[String(day)] = hours;
    return saveSettings(settings);
  }

  function setAdminPin(pin) {
    const settings = getSettings();
    settings.adminPin = String(pin || '').trim() || DEFAULT_SETTINGS.adminPin;
    return saveSettings(settings);
  }

  function getAvailableSlots(date, duration, ignoreId) {
    if (!date || isBlockedDate(date)) return [];
    const day = new Date(date + 'T12:00:00').getDay();
    const hours = getWeeklyHours(day);
    if (!hours || !Array.isArray(hours) || hours.length < 2 || !hours[0] || !hours[1]) return [];

    const durationMin = Number(duration) || 30;
    const open = toMin(hours[0]);
    const close = toMin(hours[1]);
    const slots = [];

    for (let start = open; start <= close - durationMin; start += 30) {
      const time = toTime(start);
      if (!getConflicts(date, time, durationMin, ignoreId).length) slots.push(time);
    }

    return slots;
  }

  window.BookingStore = {
    KEYS: KEYS,
    DEFAULT_HOURS: clone(DEFAULT_HOURS),
    getSettings: getSettings,
    saveSettings: saveSettings,
    getWeeklyHours: getWeeklyHours,
    getBookings: getBookings,
    saveBookings: saveBookings,
    createBooking: createBooking,
    updateBooking: updateBooking,
    setBookingStatus: setBookingStatus,
    blockDate: blockDate,
    unblockDate: unblockDate,
    blockSlot: blockSlot,
    unblockSlot: unblockSlot,
    updateWeeklyHours: updateWeeklyHours,
    setAdminPin: setAdminPin,
    getBlockedSlots: getBlockedSlots,
    isBlockedDate: isBlockedDate,
    getAvailableSlots: getAvailableSlots,
    getConflicts: getConflicts,
    ensureSlotAvailable: ensureSlotAvailable,
    toMin: toMin,
    toTime: toTime,
    overlaps: overlaps
  };
})(window);
