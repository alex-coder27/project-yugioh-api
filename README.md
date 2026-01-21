# Yu-Gi-Oh! Deck Builder

Uma aplicação full-stack para duelo e gerenciamento de decks baseada na API oficial de Yu-Gi-Oh!. A plataforma permite que duelistas busquem cartas em tempo real, gerenciem seus próprios decks seguindo as regras oficiais do TCG e alternem entre temas visualmente otimizados.

---

## 🚀 Tecnologias

### Frontend
- **React 19** com TypeScript
- **Vite** (Build tool)
- **React Router Dom 7** (Navegação)
- **Axios** (Consumo de API)
- **Jest & React Testing Library** (Testes unitários e integração)
- **CSS Modules** (Estilização)

### Backend
- **Node.js** com Express
- **TypeScript**
- **Prisma ORM** (Banco de dados SQLite por padrão)
- **Zod** (Validação de schemas)
- **JWT** (Autenticação)
- **Bcrypt** (Hash de senhas)
- **Jest & Supertest** (Testes de API)

---

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js (v18+)
- NPM ou Yarn

### 1. Configuração do Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env` na raiz da pasta backend:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_secreta_aqui"
PORT=3001
```

Inicie o banco e o servidor:

```bash
npx prisma migrate dev --name init
npm run dev
```

### 2. Configuração do Frontend

```bash
cd frontend
npm install
```

Inicie a aplicação:

```bash
npm run dev
```

---

## 🧪 Testes

O projeto possui uma cobertura rigorosa de testes para garantir a integridade das regras de duelo.

### Rodando testes do Backend

```bash
cd backend
npm test
```

- **Testes de Unidade:** Controllers, Services e Validators
- **Testes de Integração:** Fluxos completos de Deck e Autenticação via Supertest

### Rodando testes do Frontend

```bash
cd frontend
npm test
```

- **Componentes:** Validação de renderização e eventos de UI
- **Hooks:** Testes de estado do useAuth e useTheme
- **Integração:** Fluxo de login e criação de deck simulando a API

---

## 📋 Funcionalidades Principais

- **Autenticação de Duelista:** Login e Registro protegidos por JWT
- **Construtor de Decks:**
  - Mínimo de 40 e máximo de 60 cartas no Main Deck
  - Limite de 15 cartas no Extra Deck
  - Regra de no máximo 3 cópias por carta (respeitando Banlist)
- **Busca Avançada:** Filtros por nome, tipo, atributo, nível, ATK e DEF
- **Gestão de Decks:** Criar, editar, visualizar e excluir decks salvos
- **Sistema de Temas:** Alternância entre modo Light e Dark (focado em legibilidade de cartas)

---

## 🏗️ Estrutura do Projeto

```
.
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── validators/ 
│   │   └── __tests__/
│   └── prisma/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── __tests__/
└── README.md
```