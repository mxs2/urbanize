# Entrega Unidade 1 - Desenvolvimento Mobile

## Membros do Projeto
- ALAN VITOR FERREIR SOBRAL
- DIEGO DAVID ALVES XAVIER
- GABRIEL NOGUEIRA
- HYNGRID SOUZA
- ISABELA KARLA DE ARAUJO SILVA
- JAMILLA SOARES LOBO
- JANDERSON JOSÉ FERREIRA DA SILVA
- JOÃO LUCAS SANTOS LIRA
- LUCAS MATEUS ALVES LUNA
- MATEUS XAVIER SANTOS
- MIRELLA EMILY BEZERRA SANTANA
- MYLLENA CRISTIANE RIBEIRO NAVARRO LINS 
- PAMELA TEIXEIRA RODRIGUES
- PRISCILA MACIEL DE LIMA

---

## Checklist de Especificações de Entrega

- [ ] **Aplicação em React Native utilizando Expo com build para Android e iOS, somente:**
O projeto utiliza React Native e Expo, porém, ainda não está restrito somente aos builds nativos. O pacote `react-native-web` encontra-se instalado, existe um script `"web": "expo start --web"` no `package.json` e também há configurações específicas para web declaradas no `app.json`.

- [ ] **Nada de habilitar o framework para fazer deploy de aplicação PWA ou web:**
Relacionado ao ponto anterior, o ecossistema e as bibliotecas necessárias para compilar para web continuam instaladas e habilitadas no projeto.

- [ ] **Arquitetura MVVM ou MVC:**
A estrutura de pastas segue um formato genérico do React (`src/components`, `src/hooks`, `src/services`, `src/store`), não apresentando de forma estrita ou explícita a divisão em `Models`, `Views` e `Controllers` (MVC) ou `ViewModels` (MVVM).

- [x] **Integração com o backend:**
Existem integrações HTTP implementadas via `axios` na pasta `src/services`. O arquivo `src/services/api.ts` serve de base para as requisições que se comunicam com o backend (ex: `src/services/demandService.ts`).

- [x] **Utilização de GPS através do Expo Location:**
A dependência `expo-location` está instalada e configurada com a permissão correspondente (`locationWhenInUsePermission`) no `app.json`. Seu uso encontra-se aplicado em componentes como o `src/components/LocationCapture.tsx`.

- [ ] **Utilização da camera do dispositivo através do Expo Camera:**
O projeto atual não faz uso do `expo-camera`. A captura e seleção de imagens estão sendo gerenciadas pelo pacote `expo-image-picker`, visto no componente `src/components/ImageUpload.tsx`.

- [ ] **CRUD com criação, pesquisa, atualização e remoção das ocorrências:**
As operações mapeadas em `src/services/demandService.ts` incluem criação (`create`), leitura (`getAll`, `getById`) e atualização (`updateStatus`). A operação de exclusão (Delete) ainda não foi implementada.

- [x] **Listagem das ocorrências utilizando FlatList ou SectionList do React Native:**
O componente `<FlatList>` do React Native é devidamente importado e ativamente utilizado para renderizar a lista de demandas na tela principal, o que pode ser verificado em `app/(app)/demandas/index.tsx`.

- [x] **Navegação entre telas utilizando Expo Router:**
Toda a roteirização do sistema é gerenciada pela dependência `expo-router`. A arquitetura baseia-se na estrutura de arquivos e grupos no diretório `app/`.

- [x] **Persistência de estado utilizando os hooks nativos do React Native: useState e useEffect:**
Apesar do uso recorrente de `useState` e `useEffect` em componentes isolados, a gerência global e a persistência de estado da aplicação dependem inteiramente de uma biblioteca externa, o `zustand` (junto ao seu middleware de persistência), na pasta `src/store`, violando o uso exclusivo dos hooks nativos do React Native para esta finalidade.

---

## Uso de Inteligência(s) Artificial(is) no Projeto
- [ ] Utilização de IA como Claude Code (ou outras) para desenvolvimento do projeto
- [ ] Uso do set de skills **superpowers** para o desenvolvimento Spec-Driven Development
- [ ] Declaração de uso de IA no projeto de acordo com as condições estabelecidas no plano de ensino

---

### Uso de Inteligência Artificial na Disciplina

Nesta disciplina, o professor utiliza ferramentas de Inteligência Artificial (IA) como apoio às atividades de ensino — por exemplo, na geração de resumos, imagens ilustrativas de conceitos e mapas mentais —, sempre com revisão crítica prévia do conteúdo antes de sua utilização em sala de aula. O uso de IA pelos estudantes nas atividades desta disciplina é permitido mediante a declaração, prevista na Política de Governança de IA do CESAR, em atividades de geração de rascunho pela IA seguida de análise crítica (curadoria) do estudante, que deverá emitir parecer próprio sobre os acertos e eventuais erros, imprecisões ou vieses nas informações fornecidas pela ferramenta.

Aplicam-se as seguintes condições, sem as quais o uso não é autorizado:
- **Ferramentas autorizadas**: somente poderão ser utilizadas ferramentas de IA constantes no Catálogo de IA do CESAR, com status de aprovação vigente. O uso de ferramentas não catalogadas é proibido.
- **Proteção de dados**: é expressamente proibida a inserção de dados pessoais, dados pessoais sensíveis ou qualquer informação que permita identificar pessoas (próprias, de colegas, de terceiros ou de participantes de pesquisa) nas ferramentas de IA.
- **Autoria e responsabilidade humana**: o conteúdo gerado pela IA não pode ser apresentado como produção própria do estudante. Cabe ao estudante revisar criticamente o resultado, validar informações e assumir integral responsabilidade pela versão final entregue.
- **Declaração obrigatória**: todo uso de IA nesta atividade deve ser declarado no formato narrativo abaixo, informando a ferramenta utilizada, a finalidade, a etapa da atividade, o tipo de contribuição, a confirmação de que não houve tratamento de dados pessoais, e a confirmação de revisão crítica e responsabilidade humana sobre o resultado final.

Qualquer uso de IA fora do escopo acima descrito (por exemplo, em atividades avaliativas não expressamente autorizadas) é considerado **uso condicionado ou proibido**, conforme o caso, e deverá ser previamente consultado com o professor.

Modelo de declaração a ser incluído na atividade quando houver uso de IA:
_Declaro que utilizei a(s) ferramenta(s) de Inteligência Artificial [informar nome e versão da ferramenta, conforme constante no Catálogo de IA do CESAR] nesta atividade, com a finalidade de gerar um rascunho sobre [tema], sobre o qual realizei análise crítica (curadoria) das informações apresentadas. Não tratei dados pessoais no uso desta ferramenta. Revisei criticamente o conteúdo gerado, identificando seus acertos e eventuais imprecisões, e assumo a responsabilidade integral pela versão final apresentada._
