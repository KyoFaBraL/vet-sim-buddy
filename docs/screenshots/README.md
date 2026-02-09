# Capturas de Tela – VetBalance

Esta pasta contém as capturas de tela anotadas das principais interfaces do sistema VetBalance, utilizadas como evidência visual na documentação técnica.

## Nomenclatura dos arquivos

| Arquivo | Tela | Requer Login |
|---------|------|:---:|
| `01-role-selection.png` | Seleção de Papel (Tela Inicial) | Não |
| `02-auth-aluno.png` | Login/Cadastro do Aluno | Não |
| `03-auth-professor.png` | Login/Cadastro do Professor | Não |
| `04-dashboard-aluno.png` | Dashboard do Aluno (Simulador) | Sim (aluno) |
| `05-monitor-parametros.png` | Monitor de Parâmetros | Sim (aluno) |
| `06-painel-tratamentos.png` | Painel de Tratamentos | Sim (aluno) |
| `07-sistema-badges.png` | Sistema de Badges | Sim (aluno) |
| `08-ranking-semanal.png` | Ranking Semanal | Sim (aluno) |
| `09-historico-evolucao.png` | Histórico de Evolução | Sim (aluno) |
| `10-dashboard-professor.png` | Dashboard do Professor | Sim (professor) |
| `11-resultado-vitoria.png` | Resultado – Vitória | Sim (aluno) |
| `12-resultado-derrota.png` | Resultado – Derrota | Sim (aluno) |

## Como capturar

1. Acesse **https://vetbalance.app.br**
2. Para telas públicas (01-03): capture diretamente
3. Para telas internas (04-12): faça login como aluno ou professor
4. Resolução recomendada: **1920×1080 pixels**
5. Ferramentas sugeridas:
   - **Windows:** `Win + Shift + S`
   - **macOS:** `Cmd + Shift + 4`
   - **Linux:** Flameshot ou `PrtScr`
6. Salve os arquivos nesta pasta com a nomenclatura acima

## Permissões GitHub

Para que as imagens sejam versionadas no GitHub, certifique-se de que:
- A pasta `docs/screenshots/` **não está no `.gitignore`**
- Os arquivos PNG não excedam 100 MB (limite do GitHub)
- Para repositórios com LFS, considere usar `git lfs track "*.png"`
