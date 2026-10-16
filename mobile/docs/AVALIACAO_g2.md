# Relatório de Avaliação - Unidade 1 - Desenvolvimento Mobile

## Resumo do Projeto
O grupo G2 desenvolveu a plataforma **Urbanize**, um aplicativo de gestão de demandas urbanas. O projeto possui um backend Express/Prisma e um aplicativo mobile React Native feito com Expo. O aplicativo implementa funcionalidades para cidadãos (criar demandas) e gestores, utiliza o Expo Router para navegação, gerencia estados globais com Zustand e faz acesso a recursos nativos como câmera e GPS via Expo. 

## Membros
- DIEGO DAVID ALVES XAVIER
- HYNGRID SOUZA
- MATEUS XAVIER SANTOS
- JAMILLA SOARES LOBO
- PAMELA TEIXEIRA RODRIGUES
- JANDERSON JOSÉ FERREIRA DA SILVA
- ENZO ANTUNA FERREIRA

## Tabela de Avaliação (Total: 4,0 pontos)

| Critério | Valor Máximo | Nota Atribuída | Observações |
| :--- | :---: | :---: | :--- |
| **Entrega 1 (08/09)** | | | |
| Inclusão do colaborador `mr-costaalencar` | 0,2 | 0,2 |  |
| **Entrega 2 (15/09)** | | | |
| Aplicação em React Native/Expo (Android/iOS) | 0,4 | 0,4 | App construído usando a SDK do Expo 57. |
| Arquitetura clara (MVVM ou MVC) | 0,3 | 0,3 | Arquitetura organizada na pasta `/src` (components, hooks, services, store). |
| Integração com o backend definido | 0,3 | 0,3 | Consumo da API REST local e documentado via Axios. |
| **Entrega 3 (22/09)** | | | |
| Implementação de CRUD das ocorrências | 0,4 | 0,4 | Funcionalidades de criar, visualizar e listar implementadas. |
| Listagem com componentes nativos | 0,3 | 0,3 | Implementado usando `FlatList` em `app/(app)/demandas/index.tsx`. |
| Uso de GPS (Expo Location) | 0,3 | 0,3 | Módulo `expo-location` instalado e descrito. |
| Uso de Câmera (Expo Camera/Image Picker) | 0,3 | 0,3 | Usa `expo-image-picker` para fotos (`ImageUpload.tsx`). |
| **Entrega 4 (29/09)** | | | |
| Navegação com Expo Router | 0,5 | 0,5 | Utiliza rota baseada em arquivos (`/app`). |
| Persistência/Estado (`useState`, `useEffect`)| 0,5 | 0,5 | Faz uso do `zustand` combinado com Async Storage para persistência, atendendo além do básico. |
| Relatório de Uso de IA | 0,5 | 0,0 | Falta relatório descrevendo os resultados da IA e como foi feito a avaliação humana sobre tais resultados. |
| **TOTAL** |  | **3,5** |  |

## Pontos Positivos
- O projeto apresenta um grau de maturidade com uso do Docker, backend completo (Node.js, Prisma, Redis) e scripts de inicialização.
- Tratamento de autenticação, roles (Cidadão e Gestor) e triagem de imagens implementados.
- Integração de estado utilizando `zustand`.

## Pontos de Melhoria
- Fornecer o Relatório de Uso de IA incluindo detalhes sobre o uso de IA, descrevendo os resultados obtidos e a avaliação humana sobre tais resultados.
