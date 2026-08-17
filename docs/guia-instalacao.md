# Guia de instalação e execução

Guia passo a passo para rodar o Urbanize em **Linux, macOS e Windows**. O caminho recomendado é o Docker: um comando sobe a API, o Redis e o app.

---

## 1. O que vai subir

| Serviço | Endereço | O que é |
| --- | --- | --- |
| `mobile` | http://localhost:8081 | App Urbanize no navegador + QR code para o Expo Go |
| `backend` | http://localhost:4000/api | API REST (Express + Prisma) |
| `redis` | `localhost:6379` | Cache das métricas |

Os arquivos `backend/.env`, `mobile/.env` e `docker/.env` são **gerados automaticamente** — você não precisa criar nenhum deles à mão.

**Credenciais de teste (já cadastradas pelo seed):**

| Perfil | Email | Senha |
| --- | --- | --- |
| Cidadão | `cidadao@urbanize.com` | `demo` |
| Gestor | `gestor@urbanize.com` | `demo` |

---

## 2. Pré-requisitos

### Linux

- **Docker Engine** + plugin Compose:
  ```bash
  # Fedora / RHEL
  sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin

  # Ubuntu / Debian
  sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin
  ```
- Rodar Docker sem `sudo` (faça logout/login depois):
  ```bash
  sudo usermod -aG docker "$USER"
  sudo systemctl enable --now docker
  ```

### macOS

- **Docker Desktop** — https://www.docker.com/products/docker-desktop (abra o app pelo menos uma vez antes de continuar).

### Windows

- **Docker Desktop** com o backend **WSL2** (a opção padrão do instalador).
- **Git para Windows** — https://git-scm.com/download/win. Ele traz o **Git Bash**, usado para rodar os scripts.

> Os scripts do projeto são shell (`.sh`). No Windows, rode-os pelo **Git Bash** ou pelo **WSL2**, nunca pelo `cmd.exe`. A seção 3.3 mostra a alternativa manual em PowerShell.

**Verifique a instalação** (qualquer sistema):

```bash
docker --version
docker compose version
```

---

## 3. Subindo o projeto

### 3.1 Linux e macOS

```bash
git clone git@github.com:mxs2/urbanize.git
cd urbanize
./scripts/up.sh
```

Pronto. Na primeira execução o Docker baixa as imagens, instala as dependências, aplica as migrations e popula o banco — pode levar alguns minutos. Quando terminar, abra http://localhost:8081.

### 3.2 Windows (Git Bash ou WSL2)

Abra o **Git Bash** (botão direito na pasta → *Git Bash Here*) e rode exatamente os mesmos comandos:

```bash
git clone https://github.com/mxs2/urbanize.git
cd urbanize
bash scripts/up.sh
```

> Use `bash scripts/up.sh` em vez de `./scripts/up.sh`: o Windows não preserva a permissão de execução dos arquivos.

Se o Docker Desktop pedir para compartilhar a pasta (*file sharing*), aceite — os containers montam o código do projeto.

### 3.3 Windows sem Git Bash (PowerShell manual)

Só se você realmente não puder usar Git Bash/WSL. Aqui os arquivos de ambiente são criados na mão:

```powershell
cd urbanize

# 1. IP desta máquina na rede local
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
       Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
       Sort-Object InterfaceMetric | Select-Object -First 1).IPAddress
$ip   # confira o valor

# 2. Arquivos de ambiente
Copy-Item backend\.env.example backend\.env -Force
Set-Content mobile\.env "EXPO_PUBLIC_API_URL=`"http://${ip}:4000/api`""
Set-Content docker\.env  @("HOST_LAN_IP=$ip", "BACKEND_PORT=4000", "REDIS_PORT=6379", "METRO_PORT=8081")

# 3. Subir
cd docker
docker compose up --build
```

> Troque o `JWT_SECRET` em `backend\.env` por um valor próprio — o script faz isso automaticamente, este caminho manual não.

---

## 4. Abrindo o app

### No navegador

http://localhost:8081 — funciona em qualquer sistema, sem configuração extra.

### No celular físico (Expo Go)

1. Instale o **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)).
2. Conecte o celular na **mesma rede Wi-Fi** do computador.
3. Mostre o QR code:
   ```bash
   cd docker && docker compose logs mobile
   ```
4. **Android:** escaneie o QR pelo próprio Expo Go. **iOS:** escaneie pela câmera.

Prefere digitar? A URL é `exp://<IP>:8081`, onde `<IP>` é o `HOST_LAN_IP` gravado em `docker/.env`.

### No emulador Android

Com o emulador aberto, o `EXPO_PUBLIC_API_URL` já aponta para o IP da rede local, que o emulador alcança normalmente. Basta abrir a URL `exp://<IP>:8081` no Expo Go do emulador.

---

## 5. Comandos do dia a dia

Todos a partir da raiz do projeto (no Windows, prefixe com `bash`):

```bash
./scripts/up.sh              # sobe tudo (roda o setup antes)
./scripts/up.sh -d           # sobe em background
./scripts/down.sh            # para os containers
./scripts/down.sh -v         # para e apaga os volumes (reinstala e repovoa na próxima)
./scripts/setup-env.sh       # só regenera os .env
./scripts/setup-env.sh --force --ip 192.168.0.42   # força um IP específico
```

Logs e acesso aos containers:

```bash
cd docker
docker compose logs -f backend    # acompanha a API
docker compose logs mobile        # QR code do Expo Go
docker compose attach mobile      # menu interativo do Expo (r, a, w, ...)
docker compose exec backend sh    # shell dentro do backend
```

---

## 6. Rodando sem Docker

Precisa de **Node.js 22+**. Em dois terminais:

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npx prisma generate
npm run db:migrate
npm run db:seed
npm run dev

# Terminal 2 — app
cd mobile
npm install
cp .env.example .env          # ajuste o EXPO_PUBLIC_API_URL
npm start
```

Sem Docker não há Redis; o backend detecta a ausência e segue sem cache.

---

## 7. Solução de problemas

**`address already in use` na porta 8081 ou 4000**
Outro processo está usando a porta (um `expo start` ou `npm run dev` esquecido).

```bash
# Linux / macOS
ss -tlnp | grep 8081     # ou: lsof -i :8081
kill <PID>
```
```powershell
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

Ou mude a porta em `docker/.env` (`METRO_PORT`, `BACKEND_PORT`) e suba de novo.

**O celular não conecta / o app fica carregando**
- Celular e computador na mesma rede Wi-Fi?
- Redes de visitante e corporativas isolam os dispositivos — use outra rede ou roteie pelo celular.
- O IP mudou (DHCP)? Regenere e reinicie:
  ```bash
  ./scripts/setup-env.sh --force
  ./scripts/down.sh && ./scripts/up.sh -d
  ```
- No Windows, libere o Docker no Firewall quando o Windows perguntar (redes privadas).

**Mudei o `mobile/.env` e o app não vê o novo valor**
O Expo embute as variáveis no bundle e o Metro guarda cache. Recrie o container (um
`restart` não basta — ele preserva o cache):
```bash
cd docker && docker compose up -d --force-recreate mobile
```

**`permission denied` ao rodar os scripts (Linux/macOS)**
```bash
chmod +x scripts/*.sh
```

**`docker: permission denied ... /var/run/docker.sock` (Linux)**
Falta o grupo `docker`. Rode o `usermod` da seção 2 e faça logout/login.

**Quero começar do zero**
```bash
./scripts/down.sh -v      # apaga volumes (node_modules e marcador de seed)
rm backend/dev.db         # apaga o banco; o seed roda de novo na próxima subida
./scripts/up.sh
```

---

## 8. Referências

- [README](../README.md) — visão geral e funcionalidades
- [docs/api.md](api.md) — endpoints da API
- [docs/plano-de-testes.md](plano-de-testes.md) — plano de testes
