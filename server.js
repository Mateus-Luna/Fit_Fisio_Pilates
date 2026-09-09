const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Database persistence file
const DB_FILE = path.join(__dirname, 'data_store.json');

const INITIAL_DATA = {
  users: [
    {
      id: 'usr-1',
      name: 'Aline',
      email: 'aline@fitfisio.com.br',
      password: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  families: [
    {
      id: 'fam-1',
      name: 'Família Silva',
      observation: 'Desconto familiar aplicado',
      createdAt: new Date('2026-01-10').toISOString(),
      updatedAt: new Date('2026-01-10').toISOString(),
    },
    {
      id: 'fam-2',
      name: 'Família Oliveira',
      observation: 'Pais e filhos matriculados na natação',
      createdAt: new Date('2026-02-15').toISOString(),
      updatedAt: new Date('2026-02-15').toISOString(),
    },
  ],
  modalities: [
    {
      id: 'mod-1',
      name: 'Pilates',
      description: 'Aulas personalizadas de pilates em aparelhos e solo',
      monthlyPrice: 220,
      requiresClass: false,
      capacity: null,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-2',
      name: 'Fisioterapia',
      description: 'Atendimento clínico e reabilitação postural',
      monthlyPrice: 180,
      requiresClass: false,
      capacity: null,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-3',
      name: 'Hidroginástica',
      description: 'Exercícios aeróbicos aquáticos em grupo',
      monthlyPrice: 170,
      requiresClass: true,
      capacity: 8,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-4',
      name: 'Hidroterapia',
      description: 'Fisioterapia aquática para alívio articular',
      monthlyPrice: 240,
      requiresClass: true,
      capacity: 5,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-5',
      name: 'Natação Adulto',
      description: 'Aperfeiçoamento de técnicas e condicionamento',
      monthlyPrice: 190,
      requiresClass: true,
      capacity: 8,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-6',
      name: 'Natação Criança',
      description: 'Iniciação à natação e adaptação aquática infantil',
      monthlyPrice: 190,
      requiresClass: true,
      capacity: 8,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'mod-7',
      name: 'Academia',
      description: 'Musculação e treino funcional assistido',
      monthlyPrice: 130,
      requiresClass: false,
      capacity: null,
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
  ],
  students: [
    {
      id: 'std-1',
      name: 'Carlos Eduardo Silva',
      birthDate: '1990-04-12T00:00:00.000Z',
      phone: '(11) 98765-4321',
      address: 'Rua das Palmeiras, 142 - Centro',
      observation: 'Recuperação de lombalgia crônica',
      type: 'ADULT',
      rg: '34.567.890-1',
      cpf: '123.456.789-01',
      active: true,
      familyId: 'fam-1',
      createdAt: new Date('2026-02-01').toISOString(),
      updatedAt: new Date('2026-02-01').toISOString(),
    },
    {
      id: 'std-2',
      name: 'Mariana Silva',
      birthDate: '1993-09-24T00:00:00.000Z',
      phone: '(11) 98765-4322',
      address: 'Rua das Palmeiras, 142 - Centro',
      observation: 'Pilates para fortalecimento do core',
      type: 'ADULT',
      rg: '42.123.456-7',
      cpf: '234.567.890-12',
      active: true,
      familyId: 'fam-1',
      createdAt: new Date('2026-02-05').toISOString(),
      updatedAt: new Date('2026-02-05').toISOString(),
    },
    {
      id: 'std-3',
      name: 'Lucas Oliveira',
      birthDate: '2017-06-18T00:00:00.000Z',
      phone: '(11) 99123-8877',
      address: 'Av. Brasil, 800 - Apto 32',
      observation: 'Autorização médica entregue para natação',
      type: 'CHILD',
      rg: null,
      cpf: null,
      active: true,
      familyId: 'fam-2',
      createdAt: new Date('2026-02-20').toISOString(),
      updatedAt: new Date('2026-02-20').toISOString(),
    },
  ],
  enrollments: [
    {
      id: 'enr-1',
      studentId: 'std-1',
      modalityId: 'mod-1',
      status: 'ACTIVE',
      startDate: new Date('2026-02-01').toISOString(),
      endDate: null,
      contractedPrice: 220,
      discountPercentage: 10,
      discountAmount: 22,
      finalPrice: 198,
      observation: 'Plano com desconto de família',
      createdAt: new Date('2026-02-01').toISOString(),
      updatedAt: new Date('2026-02-01').toISOString(),
    },
    {
      id: 'enr-2',
      studentId: 'std-3',
      modalityId: 'mod-6',
      status: 'ACTIVE',
      startDate: new Date('2026-03-01').toISOString(),
      endDate: null,
      contractedPrice: 190,
      discountPercentage: 0,
      discountAmount: 0,
      finalPrice: 190,
      observation: 'Turma de sábados manhã',
      createdAt: new Date('2026-02-20').toISOString(),
      updatedAt: new Date('2026-02-20').toISOString(),
    },
  ],
  settings: [
    {
      id: 'set-1',
      key: 'studio_name',
      value: 'FitFisio Pilates & Saúde',
      description: 'Nome do estúdio exibido nos relatórios e recibos',
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'set-2',
      key: 'contact_phone',
      value: '(11) 98765-4321',
      description: 'Telefone e WhatsApp oficial',
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'set-3',
      key: 'pix_key',
      value: 'financeiro@fitfisio.com.br',
      description: 'Chave Pix para pagamentos de mensalidades',
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
  ],
  classes: [
    {
      id: 'cls-1',
      name: 'Hidro Manhã (Seg/Qua 08:00)',
      modalityId: 'mod-3',
      capacity: 8,
      schedules: [{ dayOfWeek: 1, startTime: '08:00', endTime: '08:50' }, { dayOfWeek: 3, startTime: '08:00', endTime: '08:50' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'cls-2',
      name: 'Hidro Tarde (Ter/Qui 16:00)',
      modalityId: 'mod-3',
      capacity: 8,
      schedules: [{ dayOfWeek: 2, startTime: '16:00', endTime: '16:50' }, { dayOfWeek: 4, startTime: '16:00', endTime: '16:50' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'cls-3',
      name: 'Hidroterapia Manhã (Ter/Qui 09:00)',
      modalityId: 'mod-4',
      capacity: 5,
      schedules: [{ dayOfWeek: 2, startTime: '09:00', endTime: '09:45' }, { dayOfWeek: 4, startTime: '09:00', endTime: '09:45' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'cls-4',
      name: 'Natação Adulto Manhã (Seg/Qua/Sex 07:00)',
      modalityId: 'mod-5',
      capacity: 8,
      schedules: [{ dayOfWeek: 1, startTime: '07:00', endTime: '07:50' }, { dayOfWeek: 3, startTime: '07:00', endTime: '07:50' }, { dayOfWeek: 5, startTime: '07:00', endTime: '07:50' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'cls-5',
      name: 'Natação Criança Tarde (Ter/Qui 15:00)',
      modalityId: 'mod-6',
      capacity: 8,
      schedules: [{ dayOfWeek: 2, startTime: '15:00', endTime: '15:45' }, { dayOfWeek: 4, startTime: '15:00', endTime: '15:45' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'cls-6',
      name: 'Pilates Manhã (Seg/Qua 08:00)',
      modalityId: 'mod-1',
      capacity: 4,
      schedules: [{ dayOfWeek: 1, startTime: '08:00', endTime: '09:00' }, { dayOfWeek: 3, startTime: '08:00', endTime: '09:00' }],
      active: true,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    },
  ],
  documents: [],
};

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (!data.classes || !Array.isArray(data.classes)) {
        data.classes = INITIAL_DATA.classes;
      }
      if (!data.documents || !Array.isArray(data.documents)) {
        data.documents = [];
      }
      return data;
    }
  } catch (err) {
    console.error('Error reading db file:', err);
  }
  saveDb(INITIAL_DATA);
  return INITIAL_DATA;
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

const db = loadDb();

function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function generateId(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
app.post(['/auth/login', '/api/auth/login'], (req, res) => {
  const { email, password } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: 'E-mail é obrigatório.' });
  }

  // Find user or match default admin
  let user = db.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  // If no user exists yet in the database, seed Aline
  if (!user && (email.includes('aline') || db.users.length === 0)) {
    user = {
      id: generateId('usr'),
      name: 'Aline',
      email: email,
      password: password || 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb(db);
  }

  // For ease of use and testing, allow login if user exists
  if (!user || !user.active) {
    // If password provided and user not found, create a demo session for the user
    user = {
      id: generateId('usr'),
      name: email.split('@')[0],
      email: email,
      password: password,
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb(db);
  }

  return res.json({
    accessToken: `token-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.post(['/auth/register', '/api/auth/register'], (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ message: 'Nome e e-mail são obrigatórios.' });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
  }

  const newUser = {
    id: generateId('usr'),
    name,
    email,
    password: password || '123',
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  saveDb(db);

  return res.status(201).json({
    message: 'Usuário criado com sucesso.',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    },
  });
});

app.get(['/auth/has-user', '/api/auth/has-user'], (req, res) => {
  res.json({ registered: db.users.length > 0 });
});

// -------------------------------------------------------------
// FAMILIES ROUTES
// -------------------------------------------------------------
app.get(['/families', '/api/families'], (req, res) => {
  const familiesWithStudents = db.families.map((f) => ({
    ...f,
    students: db.students.filter((s) => s.familyId === f.id),
  }));
  res.json(familiesWithStudents);
});

app.get(['/families/:id', '/api/families/:id'], (req, res) => {
  const family = db.families.find((f) => f.id === req.params.id);
  if (!family) {
    return res.status(404).json({ message: 'Família não encontrada.' });
  }
  const students = db.students.filter((s) => s.familyId === family.id);
  res.json({ ...family, students });
});

app.post(['/families', '/api/families'], (req, res) => {
  const { name, observation } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: 'O nome da família é obrigatório.' });
  }
  const newFamily = {
    id: generateId('fam'),
    name: name.trim(),
    observation: observation || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.families.push(newFamily);
  saveDb(db);
  res.status(201).json({ ...newFamily, students: [] });
});

app.patch(['/families/:id', '/api/families/:id'], (req, res) => {
  const index = db.families.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Família não encontrada.' });
  }
  const { name, observation } = req.body;
  if (name !== undefined) db.families[index].name = name.trim();
  if (observation !== undefined) db.families[index].observation = observation;
  db.families[index].updatedAt = new Date().toISOString();
  saveDb(db);

  const students = db.students.filter((s) => s.familyId === db.families[index].id);
  res.json({ ...db.families[index], students });
});

app.delete(['/families/:id', '/api/families/:id'], (req, res) => {
  const index = db.families.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Família não encontrada.' });
  }
  // Disassociate students
  db.students.forEach((s) => {
    if (s.familyId === req.params.id) {
      s.familyId = null;
    }
  });
  db.families.splice(index, 1);
  saveDb(db);
  res.status(204).end();
});

// -------------------------------------------------------------
// MODALITIES ROUTES
// -------------------------------------------------------------
app.get(['/modalities', '/api/modalities'], (req, res) => {
  const sorted = [...db.modalities].sort((a, b) => a.name.localeCompare(b.name));
  res.json(sorted);
});

app.get(['/modalities/:id', '/api/modalities/:id'], (req, res) => {
  const modality = db.modalities.find((m) => m.id === req.params.id);
  if (!modality) {
    return res.status(404).json({ message: 'Modalidade não encontrada.' });
  }
  res.json(modality);
});

app.post(['/modalities', '/api/modalities'], (req, res) => {
  const { name, description, monthlyPrice, requiresClass, capacity, active } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: 'Nome da modalidade é obrigatório.' });
  }

  const newModality = {
    id: generateId('mod'),
    name: name.trim(),
    description: description || null,
    monthlyPrice: Number(monthlyPrice) || 0,
    requiresClass: Boolean(requiresClass),
    capacity: requiresClass ? (Number(capacity) || 8) : null,
    active: active !== undefined ? Boolean(active) : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.modalities.push(newModality);
  saveDb(db);
  res.status(201).json(newModality);
});

app.patch(['/modalities/:id', '/api/modalities/:id'], (req, res) => {
  const index = db.modalities.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Modalidade não encontrada.' });
  }
  const body = req.body;
  const mod = db.modalities[index];
  if (body.name !== undefined) mod.name = body.name.trim();
  if (body.description !== undefined) mod.description = body.description;
  if (body.monthlyPrice !== undefined) mod.monthlyPrice = Number(body.monthlyPrice);
  if (body.requiresClass !== undefined) mod.requiresClass = Boolean(body.requiresClass);
  if (body.capacity !== undefined) mod.capacity = body.capacity ? Number(body.capacity) : null;
  if (body.active !== undefined) mod.active = Boolean(body.active);
  mod.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(mod);
});

app.patch(['/modalities/:id/activate', '/api/modalities/:id/activate'], (req, res) => {
  const mod = db.modalities.find((m) => m.id === req.params.id);
  if (!mod) return res.status(404).json({ message: 'Modalidade não encontrada.' });
  mod.active = true;
  mod.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(mod);
});

app.patch(['/modalities/:id/deactivate', '/api/modalities/:id/deactivate'], (req, res) => {
  const mod = db.modalities.find((m) => m.id === req.params.id);
  if (!mod) return res.status(404).json({ message: 'Modalidade não encontrada.' });
  mod.active = false;
  mod.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(mod);
});

// -------------------------------------------------------------
// STUDENTS ROUTES
// -------------------------------------------------------------
function enrichStudent(student) {
  const family = student.familyId ? db.families.find((f) => f.id === student.familyId) : null;
  const enrollments = db.enrollments
    .filter((e) => e.studentId === student.id)
    .map((e) => ({
      ...e,
      modality: db.modalities.find((m) => m.id === e.modalityId) || null,
      class: e.classId ? (db.classes || []).find((c) => c.id === e.classId) || null : null,
    }));
  return {
    ...student,
    family: family ? { id: family.id, name: family.name } : null,
    enrollments,
  };
}

app.get(['/students', '/api/students'], (req, res) => {
  const enriched = db.students.map(enrichStudent);
  enriched.sort((a, b) => a.name.localeCompare(b.name));
  res.json(enriched);
});

app.get(['/students/:id', '/api/students/:id'], (req, res) => {
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ message: 'Aluno não encontrado.' });
  }
  res.json(enrichStudent(student));
});

app.post(['/students', '/api/students'], (req, res) => {
  const { name, birthDate, phone, address, observation, type, rg, cpf, familyId, modalityIds, enrollments: initialEnrollments } = req.body || {};
  if (!name || !birthDate || !phone) {
    return res.status(400).json({ message: 'Nome, data de nascimento e telefone são obrigatórios.' });
  }

  const age = calculateAge(birthDate);
  const determinedType = type || (age >= 18 ? 'ADULT' : 'CHILD');

  const newStudent = {
    id: generateId('std'),
    name: name.trim(),
    birthDate: new Date(birthDate).toISOString(),
    phone: phone.trim(),
    address: address || null,
    observation: observation || null,
    type: determinedType,
    rg: determinedType === 'ADULT' ? (rg || null) : null,
    cpf: determinedType === 'ADULT' ? (cpf || null) : null,
    familyId: familyId || null,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.students.push(newStudent);

  // Atribuir modalidades informadas na criação
  const itemsToEnroll = Array.isArray(initialEnrollments) && initialEnrollments.length > 0
    ? initialEnrollments
    : (Array.isArray(modalityIds) ? modalityIds.map(mId => ({ modalityId: mId })) : []);

  itemsToEnroll.forEach(item => {
    const mod = db.modalities.find(m => m.id === item.modalityId);
    if (mod) {
      const contractedPrice = Number(mod.monthlyPrice) || 0;
      const pct = Number(item.discountPercentage) || 0;
      const discountAmount = Math.round((contractedPrice * (pct / 100)) * 100) / 100;
      const finalPrice = Math.round((contractedPrice - discountAmount) * 100) / 100;
      const newEnr = {
        id: generateId('enr'),
        studentId: newStudent.id,
        modalityId: mod.id,
        classId: item.classId || null,
        status: 'PENDING_DOCUMENTATION',
        startDate: new Date(item.startDate || Date.now()).toISOString(),
        endDate: item.endDate ? new Date(item.endDate).toISOString() : null,
        contractedPrice,
        discountPercentage: pct,
        discountAmount,
        finalPrice,
        observation: item.observation || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.enrollments.push(newEnr);

      // Gerar recibo inicial de serviço do aluno
      if (!db.documents) db.documents = [];
      db.documents.push({
        id: generateId('doc'),
        studentId: newStudent.id,
        enrollmentId: newEnr.id,
        type: 'RECEIPT',
        title: `Recibo de Prestação de Serviços - ${mod.name}`,
        content: `<h3>RECIBO DE PRESTAÇÃO DE SERVIÇO</h3><p>Declaramos que o(a) aluno(a) <strong>${newStudent.name}</strong> está devidamente matriculado(a) na modalidade <strong>${mod.name}</strong> do centro FitFisio Pilates & Saúde.</p><p>Valor da mensalidade contratada: <strong>R$ ${finalPrice.toFixed(2)}</strong>${pct > 0 ? ` (desconto de ${pct}%)` : ''}.</p><p>Data de início: ${new Date().toLocaleDateString('pt-BR')}</p><br/><br/><p>_____________________________________<br/>FitFisio Pilates & Saúde - Aline Guimarães</p>`,
        status: 'PENDING',
        issueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  saveDb(db);
  res.status(201).json(enrichStudent(newStudent));
});

app.patch(['/students/:id', '/api/students/:id'], (req, res) => {
  const index = db.students.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Aluno não encontrado.' });
  }
  const s = db.students[index];
  const b = req.body;
  if (b.name !== undefined) s.name = b.name.trim();
  if (b.birthDate !== undefined) s.birthDate = new Date(b.birthDate).toISOString();
  if (b.phone !== undefined) s.phone = b.phone.trim();
  if (b.address !== undefined) s.address = b.address;
  if (b.observation !== undefined) s.observation = b.observation;
  if (b.type !== undefined) s.type = b.type;
  if (b.rg !== undefined) s.rg = s.type === 'ADULT' ? b.rg : null;
  if (b.cpf !== undefined) s.cpf = s.type === 'ADULT' ? b.cpf : null;
  if (b.familyId !== undefined) {
    const oldFamilyId = s.familyId;
    s.familyId = (b.familyId && b.familyId !== 'null' && b.familyId !== 'undefined') ? String(b.familyId).trim() : null;

    // Sincroniza benefício do desconto familiar (10%) com as matrículas ativas
    if (s.familyId && s.familyId !== oldFamilyId) {
      (db.enrollments || []).forEach((e) => {
        if (e.studentId === s.id && e.status !== 'CANCELLED') {
          if (!e.discountPercentage || e.discountPercentage === 0) {
            e.discountPercentage = 10;
            e.discountAmount = (Number(e.contractedPrice) * 10) / 100;
            e.finalPrice = Number(e.contractedPrice) - e.discountAmount;
            e.updatedAt = new Date().toISOString();
          }
        }
      });
    } else if (!s.familyId && oldFamilyId) {
      (db.enrollments || []).forEach((e) => {
        if (e.studentId === s.id && e.status !== 'CANCELLED' && e.discountPercentage === 10) {
          e.discountPercentage = 0;
          e.discountAmount = 0;
          e.finalPrice = Number(e.contractedPrice);
          e.updatedAt = new Date().toISOString();
        }
      });
    }
  }
  s.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichStudent(s));
});

app.patch(['/students/:id/activate', '/api/students/:id/activate'], (req, res) => {
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) return res.status(404).json({ message: 'Aluno não encontrado.' });
  student.active = true;
  student.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichStudent(student));
});

app.patch(['/students/:id/deactivate', '/api/students/:id/deactivate'], (req, res) => {
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) return res.status(404).json({ message: 'Aluno não encontrado.' });
  student.active = false;
  student.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichStudent(student));
});

app.delete(['/students/:id', '/api/students/:id'], (req, res) => {
  const index = db.students.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Aluno não encontrado.' });
  }
  db.students.splice(index, 1);
  saveDb(db);
  res.status(204).end();
});

// -------------------------------------------------------------
// SETTINGS ROUTES
// -------------------------------------------------------------
app.get(['/settings', '/api/settings'], (req, res) => {
  res.json(db.settings);
});

app.get(['/settings/:key', '/api/settings/:key'], (req, res) => {
  const setting = db.settings.find((s) => s.key === req.params.key);
  if (!setting) {
    return res.status(404).json({ message: 'Configuração não encontrada.' });
  }
  res.json(setting);
});

app.post(['/settings', '/api/settings'], (req, res) => {
  const { key, value, description } = req.body || {};
  if (!key) return res.status(400).json({ message: 'Chave é obrigatória.' });

  const existing = db.settings.find((s) => s.key === key);
  if (existing) {
    return res.status(409).json({ message: 'Já existe uma configuração com essa chave.' });
  }

  const newSetting = {
    id: generateId('set'),
    key,
    value: value || '',
    description: description || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.settings.push(newSetting);
  saveDb(db);
  res.status(201).json(newSetting);
});

app.patch(['/settings/:key', '/api/settings/:key'], (req, res) => {
  const setting = db.settings.find((s) => s.key === req.params.key);
  if (!setting) {
    return res.status(404).json({ message: 'Configuração não encontrada.' });
  }
  if (req.body.value !== undefined) setting.value = req.body.value;
  if (req.body.description !== undefined) setting.description = req.body.description;
  setting.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(setting);
});

app.delete(['/settings/:key', '/api/settings/:key'], (req, res) => {
  const index = db.settings.findIndex((s) => s.key === req.params.key);
  if (index === -1) {
    return res.status(404).json({ message: 'Configuração não encontrada.' });
  }
  db.settings.splice(index, 1);
  saveDb(db);
  res.status(204).end();
});

// -------------------------------------------------------------
// CLASSES ROUTES
// -------------------------------------------------------------
app.get(['/classes', '/api/classes'], (req, res) => {
  const { modalityId } = req.query;
  let list = db.classes || [];
  if (modalityId) {
    list = list.filter((c) => c.modalityId === modalityId);
  }
  const enriched = list.map((c) => {
    const modality = (db.modalities || []).find((m) => m.id === c.modalityId) || null;
    const enrolledCount = (db.enrollments || []).filter(
      (e) => e.classId === c.id && ['ACTIVE', 'AWAITING_APPROVAL', 'PENDING_DOCUMENTATION'].includes(e.status),
    ).length;
    return {
      ...c,
      modality,
      enrolledCount,
    };
  });
  res.json(enriched);
});

app.get(['/classes/:id', '/api/classes/:id'], (req, res) => {
  const c = (db.classes || []).find((item) => item.id === req.params.id);
  if (!c) return res.status(404).json({ message: 'Turma não encontrada.' });
  const modality = (db.modalities || []).find((m) => m.id === c.modalityId) || null;
  const enrolledCount = (db.enrollments || []).filter(
    (e) => e.classId === c.id && ['ACTIVE', 'AWAITING_APPROVAL', 'PENDING_DOCUMENTATION'].includes(e.status),
  ).length;
  res.json({ ...c, modality, enrolledCount });
});

// -------------------------------------------------------------
// DISCOUNTS ROUTES
// -------------------------------------------------------------
app.post(['/discounts/calculate', '/api/discounts/calculate'], (req, res) => {
  const contractedPrice = Number(req.body.contractedPrice) || 0;
  const discountPercentage = Number(req.body.discountPercentage) || 0;

  if (contractedPrice < 0) {
    return res.status(400).json({ message: 'O valor contratado não pode ser negativo.' });
  }
  if (discountPercentage < 0 || discountPercentage > 100) {
    return res.status(400).json({ message: 'O desconto deve estar entre 0% e 100%.' });
  }

  const discountAmount = Math.round((contractedPrice * (discountPercentage / 100)) * 100) / 100;
  const finalPrice = Math.round((contractedPrice - discountAmount) * 100) / 100;

  res.json({
    contractedPrice: Math.round(contractedPrice * 100) / 100,
    discountPercentage: Math.round(discountPercentage * 100) / 100,
    discountAmount,
    finalPrice,
  });
});

// -------------------------------------------------------------
// ENROLLMENTS ROUTES
// -------------------------------------------------------------
function enrichEnrollment(e) {
  const student = (db.students || []).find((s) => s.id === e.studentId) || null;
  const modality = (db.modalities || []).find((m) => m.id === e.modalityId) || null;
  const classItem = e.classId ? (db.classes || []).find((c) => c.id === e.classId) || null : null;
  const documents = (db.documents || []).filter((d) => d.enrollmentId === e.id || (d.studentId === e.studentId && !d.enrollmentId));
  return {
    ...e,
    student,
    modality,
    class: classItem,
    documents,
  };
}

app.get(['/enrollments', '/api/enrollments'], (req, res) => {
  let list = db.enrollments || [];
  const { studentId, modalityId, status } = req.query;
  if (studentId) list = list.filter((e) => e.studentId === studentId);
  if (modalityId) list = list.filter((e) => e.modalityId === modalityId);
  if (status) list = list.filter((e) => e.status === status);

  const enriched = list.map(enrichEnrollment);
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(enriched);
});

app.get(['/enrollments/:id', '/api/enrollments/:id'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });
  res.json(enrichEnrollment(enrollment));
});

app.post(['/enrollments', '/api/enrollments'], (req, res) => {
  const { studentId, modalityId, classId, startDate, endDate, discountPercentage = 0, observation } = req.body || {};

  const student = (db.students || []).find((s) => s.id === studentId);
  if (!student) return res.status(404).json({ message: 'Aluno não encontrado.' });

  const modality = (db.modalities || []).find((m) => m.id === modalityId);
  if (!modality) return res.status(404).json({ message: 'Modalidade não encontrada.' });
  if (!modality.active) return res.status(400).json({ message: 'Não é possível realizar matrícula em uma modalidade inativa.' });

  // Validação: Impedir duplicidade de matrícula na mesma modalidade
  const activeStatuses = ['PENDING_DOCUMENTATION', 'AWAITING_APPROVAL', 'ACTIVE', 'SUSPENDED'];
  const existing = (db.enrollments || []).find(
    (e) => e.studentId === studentId && e.modalityId === modalityId && activeStatuses.includes(e.status)
  );
  if (existing) {
    return res.status(409).json({ message: 'O aluno já possui uma matrícula ativa ou em andamento nessa modalidade.' });
  }

  // Validação de turma se informada
  if (classId) {
    const cls = (db.classes || []).find((c) => c.id === classId);
    if (!cls) return res.status(404).json({ message: 'Turma não encontrada.' });
    if (cls.modalityId !== modalityId) {
      return res.status(400).json({ message: 'A turma selecionada não pertence à modalidade da matrícula.' });
    }
  }

  const contractedPrice = Number(modality.monthlyPrice) || 0;
  const pct = Math.max(0, Math.min(100, Number(discountPercentage) || 0));
  const discountAmount = Math.round((contractedPrice * (pct / 100)) * 100) / 100;
  const finalPrice = Math.round((contractedPrice - discountAmount) * 100) / 100;

  const newEnrollment = {
    id: generateId('enr'),
    studentId,
    modalityId,
    classId: classId || null,
    status: 'PENDING_DOCUMENTATION',
    startDate: new Date(startDate || Date.now()).toISOString(),
    endDate: endDate ? new Date(endDate).toISOString() : null,
    approvedAt: null,
    contractedPrice,
    discountPercentage: pct,
    discountAmount,
    finalPrice,
    observation: observation || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.enrollments.push(newEnrollment);

  // Gerar recibo de prestação de serviços inicial para esta matrícula
  if (!db.documents) db.documents = [];
  db.documents.push({
    id: generateId('doc'),
    studentId,
    enrollmentId: newEnrollment.id,
    type: 'RECEIPT',
    title: `Recibo de Prestação de Serviços - ${modality.name}`,
    content: `<h3>RECIBO DE PRESTAÇÃO DE SERVIÇO</h3><p>Declaramos para os devidos fins que o(a) aluno(a) <strong>${student.name}</strong> celebrou matrícula no curso/modalidade <strong>${modality.name}</strong> junto ao <strong>FitFisio Pilates & Saúde</strong>.</p><p>Valor mensal de tabela: R$ ${contractedPrice.toFixed(2)}<br/>Desconto acordado: ${pct}% (R$ ${discountAmount.toFixed(2)})<br/><strong>Valor final mensal: R$ ${finalPrice.toFixed(2)}</strong></p><p>Data de início: ${new Date(newEnrollment.startDate).toLocaleDateString('pt-BR')}</p><p>Cláusula: As mensalidades possuem vencimento mensal e garantem o acesso aos treinos e acompanhamento profissional especializado.</p><br/><br/><p>_____________________________________<br/>FitFisio Pilates & Saúde - Aline Guimarães</p>`,
    status: 'PENDING',
    issueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  saveDb(db);
  res.status(201).json(enrichEnrollment(newEnrollment));
});

app.patch(['/enrollments/:id', '/api/enrollments/:id'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status === 'CANCELLED' || enrollment.status === 'COMPLETED') {
    return res.status(400).json({ message: 'Não é possível editar uma matrícula cancelada ou concluída.' });
  }

  const { modalityId, classId, startDate, endDate, discountPercentage, observation } = req.body || {};

  if (modalityId && modalityId !== enrollment.modalityId) {
    const mod = (db.modalities || []).find((m) => m.id === modalityId);
    if (!mod) return res.status(404).json({ message: 'Modalidade não encontrada.' });
    enrollment.modalityId = modalityId;
    enrollment.contractedPrice = Number(mod.monthlyPrice) || 0;
  }

  if (classId !== undefined) {
    enrollment.classId = classId || null;
  }

  if (startDate) enrollment.startDate = new Date(startDate).toISOString();
  if (endDate !== undefined) enrollment.endDate = endDate ? new Date(endDate).toISOString() : null;
  if (observation !== undefined) enrollment.observation = observation;

  if (discountPercentage !== undefined || modalityId) {
    const pct = discountPercentage !== undefined ? Math.max(0, Math.min(100, Number(discountPercentage) || 0)) : enrollment.discountPercentage;
    enrollment.discountPercentage = pct;
    enrollment.discountAmount = Math.round((enrollment.contractedPrice * (pct / 100)) * 100) / 100;
    enrollment.finalPrice = Math.round((enrollment.contractedPrice - enrollment.discountAmount) * 100) / 100;
  }

  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.patch(['/enrollments/:id/request-approval', '/api/enrollments/:id/request-approval'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status !== 'PENDING_DOCUMENTATION') {
    return res.status(400).json({ message: 'A matrícula precisa estar pendente de documentação.' });
  }

  enrollment.status = 'AWAITING_APPROVAL';
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.patch(['/enrollments/:id/approve', '/api/enrollments/:id/approve'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status !== 'AWAITING_APPROVAL') {
    return res.status(400).json({ message: 'A matrícula precisa estar aguardando aprovação para ser homologada.' });
  }

  enrollment.status = 'ACTIVE';
  enrollment.approvedAt = new Date().toISOString();
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.patch(['/enrollments/:id/suspend', '/api/enrollments/:id/suspend'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status !== 'ACTIVE') {
    return res.status(400).json({ message: 'Somente matrículas ativas podem ser suspensas.' });
  }

  enrollment.status = 'SUSPENDED';
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.patch(['/enrollments/:id/reactivate', '/api/enrollments/:id/reactivate'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status !== 'SUSPENDED') {
    return res.status(400).json({ message: 'Somente matrículas suspensas podem ser reativadas.' });
  }

  enrollment.status = 'ACTIVE';
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.patch(['/enrollments/:id/cancel', '/api/enrollments/:id/cancel'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  if (enrollment.status === 'CANCELLED' || enrollment.status === 'COMPLETED') {
    return res.status(400).json({ message: 'A matrícula já está encerrada.' });
  }

  enrollment.status = 'CANCELLED';
  enrollment.endDate = enrollment.endDate || new Date().toISOString();
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

app.delete(['/enrollments/:id', '/api/enrollments/:id'], (req, res) => {
  const enrollment = (db.enrollments || []).find((e) => e.id === req.params.id);
  if (!enrollment) return res.status(404).json({ message: 'Matrícula não encontrada.' });

  enrollment.status = 'CANCELLED';
  enrollment.endDate = enrollment.endDate || new Date().toISOString();
  enrollment.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichEnrollment(enrollment));
});

// -------------------------------------------------------------
// DOCUMENTS ROUTES (RECEIPTS & CERTIFICATES)
// -------------------------------------------------------------
function enrichDocument(doc) {
  const student = (db.students || []).find((s) => s.id === doc.studentId) || null;
  const enrollment = doc.enrollmentId ? (db.enrollments || []).find((e) => e.id === doc.enrollmentId) || null : null;
  const modality = enrollment ? (db.modalities || []).find((m) => m.id === enrollment.modalityId) || null : null;
  return {
    ...doc,
    student,
    enrollment: enrollment ? { ...enrollment, modality } : null,
  };
}

app.get(['/documents', '/api/documents'], (req, res) => {
  let list = db.documents || [];
  const { studentId, enrollmentId, type } = req.query;
  if (studentId) list = list.filter((d) => d.studentId === studentId);
  if (enrollmentId) list = list.filter((d) => d.enrollmentId === enrollmentId);
  if (type) list = list.filter((d) => d.type === type);

  const enriched = list.map(enrichDocument);
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(enriched);
});

app.get(['/documents/:id', '/api/documents/:id'], (req, res) => {
  const doc = (db.documents || []).find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ message: 'Documento não encontrado.' });
  res.json(enrichDocument(doc));
});

app.post(['/documents', '/api/documents'], (req, res) => {
  const { studentId, enrollmentId, type = 'RECEIPT', title, content, issueDate, expirationDate, observation, status = 'APPROVED' } = req.body || {};

  const student = (db.students || []).find((s) => s.id === studentId);
  if (!student) return res.status(404).json({ message: 'Aluno não encontrado.' });

  const newDoc = {
    id: generateId('doc'),
    studentId,
    enrollmentId: enrollmentId || null,
    type, // 'RECEIPT' | 'CERTIFICATE'
    title: title || (type === 'RECEIPT' ? 'Recibo de Prestação de Serviços' : 'Atestado Médico / Declaração'),
    content: content || '',
    status,
    issueDate: issueDate ? new Date(issueDate).toISOString() : new Date().toISOString(),
    expirationDate: expirationDate ? new Date(expirationDate).toISOString() : null,
    observation: observation || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!db.documents) db.documents = [];
  db.documents.push(newDoc);
  saveDb(db);
  res.status(201).json(enrichDocument(newDoc));
});

app.patch(['/documents/:id', '/api/documents/:id'], (req, res) => {
  const doc = (db.documents || []).find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ message: 'Documento não encontrado.' });

  const b = req.body || {};
  if (b.title !== undefined) doc.title = b.title;
  if (b.content !== undefined) doc.content = b.content;
  if (b.status !== undefined) doc.status = b.status;
  if (b.issueDate !== undefined) doc.issueDate = b.issueDate ? new Date(b.issueDate).toISOString() : null;
  if (b.expirationDate !== undefined) doc.expirationDate = b.expirationDate ? new Date(b.expirationDate).toISOString() : null;
  if (b.observation !== undefined) doc.observation = b.observation;

  doc.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(enrichDocument(doc));
});

app.delete(['/documents/:id', '/api/documents/:id'], (req, res) => {
  const index = (db.documents || []).findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Documento não encontrado.' });
  db.documents.splice(index, 1);
  saveDb(db);
  res.status(204).end();
});

// -------------------------------------------------------------
// FRONTEND SERVING (DEV & PROD)
// -------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const distPath = path.join(__dirname, 'frontend', 'dist');

  let viteRunning = false;
  if (isDev) {
    try {
      const { createServer } = await import('./frontend/node_modules/vite/dist/node/index.js');
      const vite = await createServer({
        root: path.join(__dirname, 'frontend'),
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      viteRunning = true;
      console.log('✓ Vite middleware initialized successfully in dev mode');
    } catch (err) {
      console.warn('Vite dev middleware could not be loaded, using static files:', err.message);
    }
  }

  if (!viteRunning) {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log('✓ Serving pre-built frontend from frontend/dist');
    } else {
      console.error('Warning: frontend/dist does not exist! Please run "npm run build"');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FitFisio Pilates server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
