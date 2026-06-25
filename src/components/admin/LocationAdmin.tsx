import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Location } from '../../types';

export function LocationAdmin() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => { fetchLocations(); }, []);

  async function fetchLocations() {
    setLoading(true);
    const { data } = await supabase
      .from('locations')
      .select('*')
      .order('sort_order')
      .order('name');
    if (data) setLocations(data as Location[]);
    setLoading(false);
  }

  async function addLocation() {
    if (!newName.trim() || !newAddress.trim()) return;
    setSaving(true);
    const maxOrder = locations.reduce((m, l) => Math.max(m, l.sort_order), 0);
    await supabase.from('locations').insert({
      name: newName.trim(),
      address: newAddress.trim(),
      sort_order: maxOrder + 1,
    });
    setNewName('');
    setNewAddress('');
    await fetchLocations();
    setSaving(false);
  }

  function startEdit(loc: Location) {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditAddress(loc.address);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditAddress('');
  }

  async function saveEdit(id: string) {
    if (!editName.trim() || !editAddress.trim()) return;
    setSaving(true);
    await supabase.from('locations').update({
      name: editName.trim(),
      address: editAddress.trim(),
    }).eq('id', id);
    cancelEdit();
    await fetchLocations();
    setSaving(false);
  }

  async function toggleActive(loc: Location) {
    await supabase.from('locations').update({ is_active: !loc.is_active }).eq('id', loc.id);
    await fetchLocations();
  }

  async function removeLocation(id: string) {
    if (!confirm('この場所を削除しますか？')) return;
    await supabase.from('locations').delete().eq('id', id);
    await fetchLocations();
  }

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="location-admin">
      <section className="schedule-section">
        <h3 className="schedule-heading">場所の追加</h3>
        <p className="schedule-desc">利用者が予約時に選択できる場所を登録します</p>
        <div className="location-add-form">
          <input
            className="form-input"
            placeholder="場所名（例：渋谷カウンセリングルーム）"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            className="form-input"
            placeholder="住所（例：東京都渋谷区〇〇1-2-3）"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
          />
          <button
            className="btn-add"
            onClick={addLocation}
            disabled={!newName.trim() || !newAddress.trim() || saving}
          >
            追加
          </button>
        </div>
      </section>

      <section className="schedule-section">
        <h3 className="schedule-heading">登録済み場所</h3>
        {locations.length === 0 ? (
          <p className="schedule-empty">場所が登録されていません</p>
        ) : (
          <ul className="location-list-admin">
            {locations.map(loc => (
              <li key={loc.id} className={`location-admin-item${loc.is_active ? '' : ' inactive'}`}>
                {editingId === loc.id ? (
                  <div className="location-edit-form">
                    <input
                      className="form-input"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                    <input
                      className="form-input"
                      value={editAddress}
                      onChange={e => setEditAddress(e.target.value)}
                    />
                    <div className="location-edit-actions">
                      <button
                        className="btn-save-small"
                        onClick={() => saveEdit(loc.id)}
                        disabled={!editName.trim() || !editAddress.trim() || saving}
                      >
                        保存
                      </button>
                      <button className="btn-cancel-small" onClick={cancelEdit}>
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="location-admin-info">
                      <span className="location-admin-name">{loc.name}</span>
                      <span className="location-admin-address">{loc.address}</span>
                    </div>
                    <div className="location-admin-actions">
                      <button className="btn-edit" onClick={() => startEdit(loc)}>
                        編集
                      </button>
                      <button
                        className={`btn-toggle${loc.is_active ? ' active' : ''}`}
                        onClick={() => toggleActive(loc)}
                      >
                        {loc.is_active ? '表示中' : '非表示'}
                      </button>
                      <button className="btn-remove" onClick={() => removeLocation(loc.id)}>
                        削除
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
