export type EvidenceStatus = 'measured' | 'documented' | 'observed' | 'estimated' | 'unknown';

export interface EvidenceField<T> {
  value: T | null;
  status: EvidenceStatus;
  source?: string;
}

export interface HoleMetadata {
  id: string;
  name: string;
  par: number;
  handicap: number;
  distance_m: EvidenceField<number>;
  reconstruction: {
    label: string;
    status: EvidenceStatus;
  };
}

const allowedStatuses: EvidenceStatus[] = ['measured', 'documented', 'observed', 'estimated', 'unknown'];

export function isEvidenceStatus(input: string): input is EvidenceStatus {
  return allowedStatuses.includes(input as EvidenceStatus);
}

export function assertEvidenceField<T>(field: EvidenceField<T>, fieldName: string): void {
  if (!isEvidenceStatus(field.status)) {
    throw new Error(`Statut invalide pour ${fieldName}: ${field.status}`);
  }

  if (field.status === 'unknown' && field.value !== null) {
    throw new Error(`La valeur de ${fieldName} doit être null quand le statut est unknown.`);
  }
}
