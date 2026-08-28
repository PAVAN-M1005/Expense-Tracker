function Notifications({ notifications, dismissNotification, clearNotifications }) {
  return (
    <section className="card notifications-section">
      <div className="section-heading">
        <div>
          <h2>Notifications</h2>
          <p>Budget warnings and recurring-expense reminders appear here.</p>
        </div>
        {notifications.length > 0 && <button className="secondary-button" onClick={clearNotifications}>Clear All</button>}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state compact">
          <div className="empty-icon">🔔</div>
          <h3>No notifications</h3>
          <p>You are all caught up.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((item) => (
            <article className={`notification-item ${item.type || 'info'}`} key={item.id}>
              <div><strong>{item.title || 'Notification'}</strong><p>{item.message}</p></div>
              <button className="text-button" onClick={() => dismissNotification(item.id)}>Dismiss</button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Notifications
