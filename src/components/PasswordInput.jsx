import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ id, value, onChange, autoComplete = 'current-password', invalid, describedBy, ...rest }) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const checkCaps = (e) => setCaps(e.getModifierState && e.getModifierState('CapsLock'));

  return (
    <>
      <div className={`input-wrap ${invalid ? 'invalid' : ''}`}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onKeyUp={checkCaps}
          onKeyDown={checkCaps}
          onBlur={() => setCaps(false)}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        <button type="button" className="input-addon" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {caps && <p className="hint hint-warn">Caps Lock is on</p>}
    </>
  );
}

export const passwordChecks = (pw = '') => [
  { ok: pw.length >= 8, label: '8+ characters' },
  { ok: /[A-Za-z]/.test(pw), label: 'A letter' },
  { ok: /\d/.test(pw), label: 'A number' },
  { ok: /[^A-Za-z0-9]/.test(pw), label: 'A symbol (recommended)' },
];

export function PasswordStrength({ value }) {
  const checks = passwordChecks(value);
  const score = checks.filter((c) => c.ok).length;
  const level = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  return (
    <div className="pw-strength">
      <div className="pw-bar" data-score={score}><span /><span /><span /><span /></div>
      <div className="pw-meta">
        <span>{value ? level : 'Use letters and numbers'}</span>
      </div>
      <ul className="pw-checks">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? 'ok' : ''}>{c.label}</li>
        ))}
      </ul>
    </div>
  );
}
