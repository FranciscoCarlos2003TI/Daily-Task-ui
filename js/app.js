// js/app.js

document.addEventListener('DOMContentLoaded', () => {

    const savedUser = JSON.parse(localStorage.getItem('dailyTaskUser') || 'null');
    const userName = savedUser?.name || 'usuário';
    const userEmail = savedUser?.email || '';
    const userGreeting = document.getElementById('userGreeting');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileNameInput = document.getElementById('nomePerfil');
    const profileEmailInput = document.getElementById('emailPerfil');

    if (userGreeting) userGreeting.textContent = `Olá, ${userName}!`;
    if (profileName) profileName.textContent = userName;
    if (profileEmail) profileEmail.textContent = userEmail;
    if (profileNameInput) profileNameInput.value = userName;
    if (profileEmailInput) profileEmailInput.value = userEmail;

    // 1. Alternância de visibilidade da senha (Login e Cadastro)
    const togglePasswordButtons = document.querySelectorAll('.btn-toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            if (passwordInput) {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                button.style.opacity = isPassword ? '1' : '0.6';
            }
        });
    });

    // 2. Interatividade das tarefas (Marcar / Desmarcar) e atualização dos contadores
    const checkboxes = document.querySelectorAll('.task-item .custom-checkbox');
    const statConcluidas = document.getElementById('statConcluidas');
    const statPendentes = document.getElementById('statPendentes');
    const statTotal = document.getElementById('statTotal');
    const statAlta = document.getElementById('statAlta');

    function updateStats() {
        if (!statConcluidas || !statPendentes) return;
        const taskItems = document.querySelectorAll('.task-list-scroll .task-item');
        const totalChecked = document.querySelectorAll('.task-list-scroll .custom-checkbox:checked').length;
        const totalTasks = taskItems.length;
        const highPriorityTasks = document.querySelectorAll('.task-list-scroll .badge.alta').length;
        statTotal.textContent = totalTasks;
        statConcluidas.textContent = totalChecked;
        statPendentes.textContent = totalTasks - totalChecked;
        statAlta.textContent = highPriorityTasks;
    }

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskItem = e.target.closest('.task-item');
            const title = taskItem.querySelector('.task-title');
            if (title) {
                if (e.target.checked) {
                    title.classList.add('completed');
                } else {
                    title.classList.remove('completed');
                }
            }
            updateStats();
        });
    });

    document.querySelectorAll('.btn-action[title="Editar"]').forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = 'editar-tarefa.html';
        });
    });

    document.querySelectorAll('.btn-action[title="Excluir"]').forEach(button => {
        button.addEventListener('click', () => {
            if (!window.confirm('Deseja excluir esta tarefa?')) return;
            button.closest('.task-item')?.remove();
            updateStats();
        });
    });

    updateStats();

    // 3. Seleção de Prioridade na tela de Nova Tarefa
    const priorityButtons = document.querySelectorAll('.priority-btn');
    const hiddenPriorityInput = document.getElementById('prioridadeTarefa');
    
    priorityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            priorityButtons.forEach(b => {
                b.style.transform = 'none';
                b.style.boxShadow = 'none';
                b.style.opacity = '0.6';
            });
            btn.style.opacity = '1';
            btn.style.transform = 'scale(1.03)';
            btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            if (hiddenPriorityInput) {
                hiddenPriorityInput.value = btn.getAttribute('data-priority');
            }
        });
    });

    // Ativa a prioridade inicial
    const initialPriorityBtn = document.querySelector('.priority-btn.alta');
    if (initialPriorityBtn) {
        initialPriorityBtn.style.opacity = '1';
        initialPriorityBtn.style.transform = 'scale(1.03)';
        initialPriorityBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
    }

    // 4. Fluxo de Login
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // 5. Fluxo de Cadastro
    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const senha = document.getElementById('senha')?.value;
            const confirmaSenha = document.getElementById('confirmaSenha')?.value;

            if (senha && confirmaSenha && senha !== confirmaSenha) {
                alert('As senhas não coincidem. Por favor, verifique!');
                return;
            }

            localStorage.setItem('dailyTaskUser', JSON.stringify({ name: nome, email }));

            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            window.location.href = 'login.html';
        });
    }

    // 6. Fluxo de Criação de Tarefa
    const formNovaTarefa = document.getElementById('formNovaTarefa');
    if (formNovaTarefa) {
        formNovaTarefa.addEventListener('submit', (e) => {
            e.preventDefault();
            const titulo = document.getElementById('tituloTarefa')?.value;
            alert(`Tarefa "${titulo}" salva com sucesso!`);
            window.location.href = 'index.html';
        });
    }

    // 7. Fluxo de edição e exclusão de tarefa
    const formEditarTarefa = document.getElementById('formEditarTarefa');
    const deleteTaskButton = document.querySelector('.btn-danger-outline');

    if (formEditarTarefa) {
        formEditarTarefa.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Tarefa atualizada com sucesso!');
            window.location.href = 'index.html';
        });
    }

    if (deleteTaskButton) {
        deleteTaskButton.addEventListener('click', () => {
            if (!window.confirm('Deseja excluir esta tarefa?')) return;
            alert('Tarefa excluída com sucesso!');
            window.location.href = 'index.html';
        });
    }
});


