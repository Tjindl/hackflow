import { formatDepth } from '../lib/format';
import { SEAFLOOR_COORDINATES, type Zone } from '../ocean/zones';
import styles from './FieldNotes.module.css';

export function FieldNotes({ zone }: { zone: Zone }) {
  const location =
    zone.id === 'seafloor'
      ? SEAFLOOR_COORDINATES
      : `${formatDepth(zone.depth).replace(' m', '')}–${formatDepth(zone.floor)}`;

  return (
    <aside className={styles.notes} aria-label="Field notes">
      <p className={styles.heading}>Field notes</p>
      <div key={zone.id} className={styles.body}>
        <p className={styles.name}>{zone.name}</p>
        <p className={styles.meta}>
          {zone.scientificName} · {location}
        </p>
        <p className={styles.note}>{zone.note}</p>
      </div>
    </aside>
  );
}
