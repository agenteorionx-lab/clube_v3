# Clube v3

Sistema de Gestão de Assinaturas e Carteirinhas.

## Instalação

1.  Abra o terminal nesta pasta (`clube-v3`).
2.  Instale as dependências:
    ```bash
    npm install
    ```

## Execução

1.  Inicie o servidor:
    ```bash
    node server.js
    ```
2.  Acesse no navegador:
    ```
    http://localhost:3000
    ```

## Login Inicial

*   **Email**: `admin@clube.com`
*   **Senha**: `123456`

## Funcionalidades

*   **Dashboard**: Visão geral de assinantes Ativos, Pendentes, Cancelados.
*   **Gestão de Clientes**: Cadastro e Listagem.
*   **Pagamento**: Botão "Confirmar Pagamento" renova a validade por 30 dias.
*   **Carteirinha**: Botão na lista de clientes abre a visualização e permite baixar PDF.

## Estrutura do Projeto

*   `/public`: Arquivos Frontend (HTML, CSS, JS).
*   `/controllers`: Lógica de Backend.
*   `/routes`: Rotas da API.
*   `server.js`: Arquivo principal do servidor.
*   `database.js`: Configuração do banco SQLite (`clube.db`).
*   `clube.db`: Banco de dados (criado automaticamente ao rodar).
