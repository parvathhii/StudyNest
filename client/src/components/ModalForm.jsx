export default function ModalForm({ title, children, onClose, onSubmit, submitLabel = 'Save' }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <form className="modal-card" onSubmit={onSubmit} aria-label={title}>
      <div className="modal-heading"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">×</button></div>
      {children}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" type="submit">{submitLabel}</button></div>
    </form>
  </div>;
}
