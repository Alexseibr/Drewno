import React from 'react';
import { BookingSummary, Contact } from '../types';

interface GuestPanelProps {
  contact?: Contact;
  bookings: BookingSummary[];
}

export const GuestPanel: React.FC<GuestPanelProps> = ({ contact, bookings }) => {
  return (
    <div className="card guest-panel">
      <div className="guest-heading">
        <span>Гость</span>
        {contact?.channel && <span className="badge">{contact.channel}</span>}
      </div>
      {contact ? (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{contact.name || 'Неизвестно'}</div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>{contact.phone || 'Телефон не указан'}</div>
        </div>
      ) : (
        <div className="placeholder">Нет данных о госте</div>
      )}

      <div className="divider" />
      <div style={{ fontWeight: 600 }}>Связанные брони</div>
      <div className="booking-list">
        {bookings.length === 0 && <div className="placeholder">Брони не найдены</div>}
        {bookings.map((booking) => (
          <div key={booking.id} className="booking-item">
            <div className="booking-title">Бронь #{booking.id}</div>
            <div style={{ color: '#4b5563', fontSize: 14 }}>{booking.roomTitle}</div>
            <div style={{ color: '#6b7280', fontSize: 13 }}>
              {booking.arrivalDate} → {booking.departureDate}
            </div>
            <div style={{ marginTop: 4 }}>
              <span className="badge">{booking.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
