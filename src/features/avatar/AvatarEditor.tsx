import { useState } from 'react';
import { Check, Eye, Footprints, Glasses, Palette, Save, Scissors, Shirt, SlidersHorizontal, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AvatarRenderer from './AvatarRenderer';
import { AvatarCategory, avatarCatalog, avatarItem, EquipmentCategory, equipmentCategories } from './avatarCatalog';
import { useAvatar } from './useAvatar';
import './avatar.css';

const categories = [
  { id: 'base', label: 'Base', icon: UserRound },
  { id: 'skinTone', label: 'Piel', icon: UserRound },
  { id: 'hairstyle', label: 'Peinado', icon: Scissors },
  { id: 'hairColor', label: 'Pelo', icon: Palette },
  { id: 'eyeColor', label: 'Ojos', icon: Eye },
  { id: 'top', label: 'Arriba', icon: Shirt },
  { id: 'bottom', label: 'Pantalón', icon: SlidersHorizontal },
  { id: 'shoes', label: 'Calzado', icon: Footprints },
  { id: 'accessory', label: 'Accesorios', icon: Glasses },
] satisfies { id: AvatarCategory; label: string; icon: typeof Shirt }[];

const titles: Record<AvatarCategory, string> = {
  base: 'Tu base de personaje',
  skinTone: 'Tu tono de piel', hairstyle: 'Un peinado a tu manera', hairColor: 'El color de tu pelo', eyeColor: 'El color de tus ojos',
  top: 'Elegí qué llevar arriba', bottom: 'Tu próximo favorito', shoes: 'Para dar el siguiente paso', accessory: 'Ese toque personal',
};

export default function AvatarEditor({onShop}: {onShop?: (category: EquipmentCategory) => void}) {
  const { config, savedConfig, state, loading, saving, error, message, select, save, dirty } = useAvatar();
  const [category, setCategory] = useState<AvatarCategory>('top');
  const selected = avatarItem(config, category);

  if (loading) return <div className="avatar-studio avatar-loading" role="status">Preparando tu personaje…</div>;

  return <section className="avatar-studio" aria-label="Editor de personajes">
    <div className="avatar-workspace">
      <div className="avatar-stage" aria-label="Vista previa">
        <div className="avatar-stage-heading"><span className="avatar-eyebrow">HECHO A TU MANERA</span><h3>Tu mundo.<br />Tu personaje.</h3></div>
        <div className="avatar-halo" aria-hidden="true" />
        <AvatarRenderer config={config} className="avatar-character" />
        <div className="avatar-stage-caption"><span aria-hidden="true">✦</span> Un poquito más vos</div>
      </div>
      <div className="avatar-controls">
        <div className="avatar-panel-heading"><span className="avatar-eyebrow">ESTUDIO DE AVATARES</span><h3>Creá tu estilo</h3><p>Probá, combiná y elegí lo que te represente.</p></div>
        <nav className="avatar-categories" aria-label="Categorías de personalización">
          {categories.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={category === id}
            aria-controls="avatar-options" onClick={() => setCategory(id)} className="avatar-category">
            <Icon size={21} aria-hidden="true" /><span>{label}</span>
          </button>)}
        </nav>
        <fieldset id="avatar-options" className="avatar-options-group" key={category}>
          <legend>{titles[category]}</legend>
          <p className="avatar-selection">Seleccionado: <strong>{selected.name}</strong></p>
          <div className="avatar-options">
            {avatarCatalog[category].filter(item => item.available && (item.unlock === 'free' || state.inventory.includes(`${category}:${item.id}`))).map(item => <label className="avatar-option" key={item.id}>
              <input type="radio" aria-label={item.name} aria-describedby={`avatar-state-${category}-${item.id}`} name={`avatar-${category}`} value={item.id} disabled={saving} checked={config[category] === item.id}
                onChange={() => select(category, item.id)} />
              <span className="avatar-option-card">
                <span className="avatar-option-art" aria-hidden="true">
                  {['skinTone', 'hairColor', 'eyeColor'].includes(category)
                    ? <span className="avatar-swatch" style={{ backgroundColor: item.color }} />
                    : category === 'accessory' && item.id === 'none'
                      ? <UserRound size={46} strokeWidth={1.3} />
                      : <AvatarRenderer config={{ ...config, [category]: item.id, ...(category==='hairstyle'?{accessory:'none'}:{}) }} category={category} decorative />}
                </span>
                <span className="avatar-option-name">{item.name}</span>
                <span id={`avatar-state-${category}-${item.id}`} className="avatar-option-state">{config[category]===item.id&&savedConfig[category]!==item.id?'Sin guardar':savedConfig[category]===item.id?'Equipado':'Disponible'}</span>
                <span className="avatar-option-check" aria-hidden="true"><Check size={13} /></span>
              </span>
            </label>)}
            {onShop&&equipmentCategories.includes(category as EquipmentCategory)&&<button type="button" className="avatar-option avatar-more" onClick={()=>onShop(category as EquipmentCategory)}>Conseguí más en la tienda</button>}
          </div>
        </fieldset>
        <div className="avatar-save-area">
          <p className="avatar-feedback" role="status" aria-live="polite">{dirty ? 'Tenés cambios sin guardar.' : message || 'Elegí una opción para empezar.'}</p>
          {error && <p className="avatar-error" role="alert">{error}</p>}
          <Button type="button" size="lg" className="avatar-save" onClick={save} disabled={saving}>
            <Save aria-hidden="true" />{saving ? 'Guardando…' : 'Guardar mi avatar'}
          </Button>
          <p className="avatar-storage-note">Tus opciones disponibles. Encontrá más en la tienda.</p>
        </div>
      </div>
    </div>
  </section>;
}
