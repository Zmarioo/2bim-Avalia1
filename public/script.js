// Variável global para guardar o token recebido do Google
let userToken = null;

// Função chamada automaticamente pelo Google após um login bem-sucedido
function handleCredentialResponse(response) {
    userToken = response.credential;
    document.getElementById('mensagem-erro').innerText = 'Login efetuado com sucesso! Agora podes gerar o desenho.';
    document.getElementById('mensagem-erro').style.color = 'green';
    
    // Esconder o botão do Google para não voltar a pedir login
    const googleButton = document.querySelector('.g_id_signin');
    if (googleButton) {
        googleButton.style.display = 'none';
    }
}

document.getElementById('form-desenho').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const erroDiv = document.getElementById('mensagem-erro');
    const svgDiv = document.getElementById('container-svg');
    erroDiv.innerText = '';
    erroDiv.style.color = 'red';
    svgDiv.innerHTML = '';

    // Se o utilizador ainda não fez login, mostra erro
    if (!userToken) {
        erroDiv.innerText = 'Erro: Por favor, faz login com a tua conta Google primeiro.';
        return;
    }

    const numeroInput = parseInt(document.getElementById('numero').value, 10);

    try {
        // Fazer a requisição POST para a API, enviando o número no corpo e o token no cabeçalho
        const res = await fetch('/api/desenho', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ numero: numeroInput })
        });

        if (res.status === 200) {
            // Se sucesso, mostrar o SVG
            const svgText = await res.text();
            svgDiv.innerHTML = svgText;
        } else if (res.status === 400 || res.status === 401) {
            // Se erro de validação (400 ou 401), mostrar a mensagem vinda do servidor
            const errorData = await res.json();
            erroDiv.innerText = `Erro (${res.status}): ${errorData.error}`;
        } else {
            // Outros erros
            erroDiv.innerText = `Erro inesperado do servidor (Código: ${res.status}).`;
        }
    } catch (err) {
        erroDiv.innerText = 'Erro de comunicação com o servidor. Tenta novamente.';
    }
});