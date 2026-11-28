import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { extractErrorMessage } from '../utils/errorParser.ts';

const EMPTY_FORM = { departments: '', years: '', divisions: '' };

function optionsToText(options) {
  return Array.isArray(options) ? options.join('\n') : '';
}

function textToOptions(value) {
  return value.split(/\r?\n/).map((option) => option.trim()).filter(Boolean);
}

export default function AcademicSetupPanel({ apiUrl }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch(`${apiUrl}/api/academic/config`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(extractErrorMessage(data, 'Could not load academic setup.'));
        if (active) {
          setForm({
            departments: optionsToText(data.departments),
            years: optionsToText(data.years),
            divisions: optionsToText(data.divisions)
          });
        }
      })
      .catch((loadError) => { if (active) setError(extractErrorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [apiUrl]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await apiFetch(`${apiUrl}/api/dean/academic-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departments: textToOptions(form.departments),
          years: textToOptions(form.years),
          divisions: textToOptions(form.divisions)
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        throw new Error(extractErrorMessage(data, 'Could not save academic setup.'));
      }
      setForm({
        departments: optionsToText(data.departments),
        years: optionsToText(data.years),
        divisions: optionsToText(data.divisions)
      });
      setMessage('Academic options saved. Student and faculty forms now use these lists.');
    } catch (saveError) {
      setError(extractErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <section className="av-panel">
      <h2>Academic setup</h2>
      <p className="av-subtitle">Maintain the department, academic year, and division options used across student and faculty workflows. Enter one option per line.</p>
      {error && <div className="av-error" role="alert">{error}</div>}
      {message && <div className="av-message" role="status">{message}</div>}
      <form className="av-form-grid" onSubmit={save}>
        <label>Departments
          <textarea rows="5" required value={form.departments} onChange={(event) => update('departments', event.target.value)} placeholder={'Civil Engineering\nComputer Engineering'} />
        </label>
        <label>Academic years
          <textarea rows="5" required value={form.years} onChange={(event) => update('years', event.target.value)} placeholder={'1st Year\n2nd Year'} />
        </label>
        <label>Class divisions
          <textarea rows="5" required value={form.divisions} onChange={(event) => update('divisions', event.target.value)} placeholder={'A\nB\nC'} />
        </label>
        <button className="av-primary" disabled={loading || saving}>{saving ? 'Saving…' : loading ? 'Loading…' : 'Save academic options'}</button>
      </form>
    </section>
  );
}
