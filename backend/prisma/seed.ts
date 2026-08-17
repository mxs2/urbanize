import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const organs = [
  {
    sigla: "EMLURB",
    nome: "Empresa de Manutenção e Limpeza Urbana",
    email: "atendimento@emlurb.recife.pe.gov.br",
    telefone: "0800 081 0155",
    whatsapp: null as null,
    site: "https://www2.recife.pe.gov.br/servico/emlurb",
    categoriasJson: JSON.stringify(["coleta_de_lixo", "zeladoria"]),
  },
  {
    sigla: "SEINFRA",
    nome: "Secretaria de Infraestrutura",
    email: "seinfra@recife.pe.gov.br",
    telefone: "0800 081 0166",
    whatsapp: null as null,
    site: "https://www2.recife.pe.gov.br",
    categoriasJson: JSON.stringify(["vias_publicas"]),
  },
  {
    sigla: "NEOENERGIA",
    nome: "Neoenergia Pernambuco",
    email: "atendimento@neoenergia.com",
    telefone: "0800 081 0120",
    whatsapp: "558130306000",
    site: "https://www.neoenergia.com/web/pernambuco",
    categoriasJson: JSON.stringify(["iluminacao_publica"]),
  },
  {
    sigla: "COMPESA",
    nome: "Companhia Pernambucana de Saneamento",
    email: "sac@compesa.com.br",
    telefone: "0800 081 0195",
    whatsapp: null as null,
    site: "https://www.compesa.com.br",
    categoriasJson: JSON.stringify(["saneamento"]),
  },
  {
    sigla: "SECOM",
    nome: "Secretaria de Controle Urbano",
    email: "secom@recife.pe.gov.br",
    telefone: "0800 081 0177",
    whatsapp: null as null,
    site: "https://www2.recife.pe.gov.br",
    categoriasJson: JSON.stringify(["fiscalizacao", "outros"]),
  },
];

const usersData = [
  {
    nome: "Cidadão Demo",
    email: "cidadao@urbanize.com",
    role: "cidadao" as const,
    organSigla: null as string | null,
  },
  {
    nome: "Gestor Emlurb",
    email: "gestor@urbanize.com",
    role: "gestor" as const,
    organSigla: "EMLURB" as string | null,
  },
];

const demandsData = [
  {
    protocolo: "URB-10001",
    titulo: "Poste apagado na Av. Boa Viagem",
    descricao: "Poste em frente ao número 900 está apagado há 3 dias.",
    categoria: "iluminacao_publica" as const,
    prioridade: "media" as const,
    status: "em_analise" as const,
    endereco: "Av. Boa Viagem, 900",
    bairro: "Boa Viagem",
    cidade: "Recife",
    scoreTriagem: 0.72,
    sugestaoEncaminhamento: "Neoenergia Pernambuco",
    organSigla: "NEOENERGIA",
  },
  {
    protocolo: "URB-10002",
    titulo: "Buraco em via principal",
    descricao: "Buraco grande antes do semáforo, risco de acidente.",
    categoria: "vias_publicas" as const,
    prioridade: "alta" as const,
    status: "em_atendimento" as const,
    endereco: "Av. Agamenon Magalhães",
    bairro: "Derby",
    cidade: "Recife",
    scoreTriagem: 0.86,
    sugestaoEncaminhamento: "Secretaria de Infraestrutura",
    organSigla: "SEINFRA",
  },
  {
    protocolo: "URB-10003",
    titulo: "Coleta de lixo atrasada",
    descricao: "Coleta não passa há 2 dias na rua.",
    categoria: "coleta_de_lixo" as const,
    prioridade: "baixa" as const,
    status: "resolvida" as const,
    endereco: "Rua da Aurora, 300",
    bairro: "Santo Amaro",
    cidade: "Recife",
    scoreTriagem: 0.78,
    sugestaoEncaminhamento: "Empresa de Manutenção e Limpeza Urbana",
    organSigla: "EMLURB",
  },
];

async function main() {
  const senhaHash = await bcrypt.hash("demo", 10);

  const organMap: Record<string, string> = {};
  for (const organ of organs) {
    const created = await prisma.organ.upsert({
      where: { sigla: organ.sigla },
      update: organ,
      create: organ,
    });
    organMap[organ.sigla] = created.id;
  }

  const userMap: Record<string, string> = {};
  for (const u of usersData) {
    const organConnect = u.organSigla ? { organ: { connect: { id: organMap[u.organSigla] } } } : {};
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { nome: u.nome, role: u.role, senhaHash, ...organConnect },
      create: { nome: u.nome, email: u.email, role: u.role, senhaHash, ...organConnect },
    });
    userMap[u.email] = created.id;
  }

  const citizenId = userMap["cidadao@urbanize.com"];
  const citizen = await prisma.user.findUnique({ where: { id: citizenId } });

  for (const demand of demandsData) {
    const { organSigla, ...demandData } = demand;
    const organConnect = { organ: { connect: { id: organMap[organSigla] } } };
    await prisma.demand.upsert({
      where: { protocolo: demand.protocolo },
      update: { ...demandData, ...organConnect },
      create: {
        ...demandData,
        nomeSolicitante: citizen!.nome,
        emailSolicitante: citizen!.email,
        origem: "cidadao",
        ...organConnect,
        user: { connect: { id: citizenId } },
        historico: {
          create: [
            { status: "registrada", descricao: "Registrada pelo cidadão", autor: citizen!.nome },
            {
              status: demandData.status,
              descricao: "Status inicial da base de demonstração",
              autor: "Sistema",
            },
          ],
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Base de demonstração populada.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
