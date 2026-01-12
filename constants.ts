import { MasterStructure } from './types';

export const MASTER_STRUCTURE: MasterStructure = {
  "1. Documentación Legal": [
    { q: "¿La empresa posee RIF, NIL y solvencia IVSS/INCES?", ref: "C.Com, Ley SS", s: "leve" },
    { q: "¿Existe una Política de SST visible y aprobada?", ref: "Art. 56 LOPCYMAT", s: "grave" },
    { q: "¿Se mantiene la nómina al día?", ref: "LOTTT", s: "grave" }
  ],
  "2. Gestión de Trabajadores": [
    { q: "¿Registro IVSS (14-02)?", ref: "Art. 53 LOPCYMAT", s: "grave" },
    { q: "¿Rutagramas firmados?", ref: "Art. 69 LOPCYMAT", s: "leve" },
    { q: "¿Notificación de Riesgos?", ref: "Art. 56 LOPCYMAT", s: "muy-grave" }
  ],
  "3. Organización Preventiva": [
    { q: "¿Delegados de Prevención electos?", ref: "Art. 41 LOPCYMAT", s: "grave" },
    { q: "¿Comité CSSL registrado?", ref: "Art. 46 LOPCYMAT", s: "grave" },
    { q: "¿El Servicio de SST funciona?", ref: "Art. 39 LOPCYMAT", s: "muy-grave" }
  ],
  "4. Programa de SST": [
    { q: "¿PSST aprobado bajo NT-04?", ref: "NT-04", s: "muy-grave" },
    { q: "¿AST por puesto de trabajo?", ref: "NT-04", s: "grave" },
    { q: "¿Estadísticas de accidentes al día?", ref: "Art. 73 LOPCYMAT", s: "grave" }
  ],
  "5. Salud Ocupacional": [
    { q: "¿Exámenes médicos al día?", ref: "Art. 27 RLOPCYMAT", s: "muy-grave" },
    { q: "¿Vigilancia epidemiológica activa?", ref: "Art. 34 RLOPCYMAT", s: "grave" }
  ],
  "6. Seguridad Industrial": [
    { q: "¿Tableros eléctricos cerrados e identificados?", ref: "COVENIN 2000", s: "muy-grave" },
    { q: "¿Máquinas con guardas de seguridad?", ref: "NT-04", s: "muy-grave" },
    { q: "¿Procedimiento de Bloqueo LOTO?", ref: "Art. 59 LOPCYMAT", s: "grave" }
  ],
  "7. Emergencias": [
    { q: "¿Extintores vigentes y señalizados?", ref: "COVENIN 1040", s: "grave" },
    { q: "¿Rutas de evacuación libres?", ref: "COVENIN 810", s: "muy-grave" }
  ],
  "8. EPP": [
    { q: "¿Entrega de EPP registrada con firmas?", ref: "Art. 53 LOPCYMAT", s: "muy-grave" },
    { q: "¿Uso correcto del EPP en planta?", ref: "Art. 53", s: "grave" }
  ]
};

export const DEFAULT_UT = 45.0; // Valor de la Unidad Tributaria
export const DEFAULT_BCV = 56.40; // Tasa referencial BCV