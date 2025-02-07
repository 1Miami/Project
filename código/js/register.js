// Adiciona um evento de mudança (change) no input de arquivo (foto de perfil)
document.getElementById('profilePhoto').addEventListener('change', function () {
    // Obtém o arquivo selecionado pelo usuário
    const file = this.files[0];

    if (file) {
        // Se houver um arquivo, cria um leitor de arquivo para gerar uma pré-visualização
        const reader = new FileReader();
        reader.onloadend = function () {
            // Quando o arquivo for carregado, exibe a imagem de pré-visualização
            document.getElementById('previewImage').src = reader.result;
            document.getElementById('previewImage').style.display = 'block'; // Exibe a imagem
            document.getElementById('defaultIcon').style.display = 'none'; // Esconde o ícone de "+" após a imagem ser carregada
        };
        reader.readAsDataURL(file); // Lê o arquivo como uma URL de dados (base64)
    }
});

// Adiciona um evento de clique ao ícone "+" para abrir o seletor de arquivos (foto de perfil)
document.getElementById('defaultIcon').addEventListener('click', function () {
    // Quando o ícone de "+" for clicado, simula um clique no input de arquivo
    document.getElementById('profilePhoto').click();
});

// Adiciona um evento de envio (submit) no formulário de registro
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    // Previne o comportamento padrão de envio do formulário
    e.preventDefault();

    // Cria um FormData, que permite enviar dados de formulário, incluindo arquivos
    const formData = new FormData();
    // Adiciona os dados do formulário (nome, contato, idade, senha e foto de perfil)
    formData.append('name', document.getElementById('name').value);
    formData.append('contact_info', document.getElementById('contact').value);
    formData.append('age', document.getElementById('age').value);
    formData.append('password', document.getElementById('password').value);
    formData.append('profilePhoto', document.getElementById('profilePhoto').files[0]);

    // Envia os dados para o servidor via POST usando o método fetch
    const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        body: formData,
    });

    // Define a referência para o elemento de mensagem, onde a resposta será exibida
    const messageElement = document.getElementById('message'); // Define messageElement

    // Se a resposta for bem-sucedida (status 2xx), exibe uma mensagem de sucesso
    if (response.ok) {
        messageElement.textContent = 'Usuário registrado com sucesso!';
        // Após 2 segundos, redireciona o usuário para a página de login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } else {
        // Se a resposta não for bem-sucedida, exibe a mensagem de erro do servidor
        const errorMessage = await response.text();
        messageElement.textContent = errorMessage;
    }
});
