// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Simulação do Fluxo de Login
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault(); // Evita reload da página
            // Aqui futuramente entrará o `fetch` para a API (Entrega 4)
            window.location.href = 'index.html'; // Redireciona para o Dashboard
        });
    }

    // Simulação do Fluxo de Cadastro
    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', (e) => {
            e.preventDefault();
            const senha = document.getElementById('senha')?.value;
            const confirmaSenha = document.getElementById('confirmaSenha')?.value;

            if (senha && confirmaSenha && senha !== confirmaSenha) {
                alert('As senhas não coincidem!');
                return;
            }

            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            window.location.href = 'login.html';
        });
    }

    // Simulação da Criação de Tarefa
    const formNovaTarefa = document.getElementById('formNovaTarefa');
    if (formNovaTarefa) {
        formNovaTarefa.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Tarefa salva com sucesso!');
            window.location.href = 'index.html';
        });
    }
});

