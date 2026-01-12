export type Severity = 'leve' | 'grave' | 'muy-grave';

export interface Question {
  q: string;
  ref: string;
  s: Severity;
}

export interface MasterStructure {
  [category: string]: Question[];
}

export type InspectionStatus = 'Sí' | 'No' | 'NA' | null;

export interface InspectionDetail {
  q: string;
  sec: string;
  ref: string;
  s: Severity;
  status: InspectionStatus;
  obs: string;
  act: string;
  prio: 'Alta' | 'Media' | 'Baja';
}

export interface InspectionState {
  [id: string]: InspectionDetail;
}

export interface ClientData {
  fecha: string;
  cliente: string;
  responsable: string;
  cedula: string;
  cargo: string;
  inspector: string;
}

export interface HistoryRecord {
  id: string;
  fecha: string;
  cliente: string;
  data: ClientData;
  state: InspectionState;
}