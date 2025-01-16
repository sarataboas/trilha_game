

// Elementos da Página
const loginForm = document.querySelector(".login");
const homepage = document.getElementById("homepage");
const configArea = document.getElementById("config-area");
const boardArea = document.getElementById("board-area");


// Lida com o clique no botão de login
document.getElementById('btn').addEventListener('click', async function(event) {
    event.preventDefault();
    const nick = document.getElementById('user').value;
    const password = document.getElementById('password').value;

    if (nick && password) {
        const success = await registerPlayer(nick, password);
        if (success) {
            loginForm.style.display = "none";
            homepage.style.display = "block";
        }
    } else {
        alert('Por favor, preencha o nickname e a senha!');
    }
});



// Botão "Jogar" - Mostra as Configurações
document.getElementById("play-game").addEventListener("click", function() {
    homepage.style.display = "none";
    configArea.style.display = "block";
});


// Botão "Logout" - Volta ao Login
document.getElementById("logout").addEventListener("click", function() {
    homepage.style.display = "none";
    loginForm.style.display = "block";
});


// Botão "Voltar" nas configuracaoes
document.getElementById("back-to-home-from-conf").addEventListener("click", function() {
    boardArea.style.display = "none";
    configArea.style.display = "none";
    homepage.style.display = "block";
});


//------------------------------------------------comunications----------------------------------------------------
//------------------------------------------------register----------------------------------------------------------------------
async function registerPlayer(nick, password) {
    try {
        const response = await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nick, password }) // Envia os dados do jogador
        });

        const data = await response.json();

        if (response.ok) {
            // alert('Registro realizado com sucesso!');
            return true
        } else if (data.error === 'User registered with a different password') {
            alert('Erro: Este usuário já está registrado com outra senha.');
            return false
        } else {
            alert(`Erro: ${data.error}`);
            return false
        }
    } catch (error) {
        console.error('Erro ao registrar:', error);
        alert('Erro ao conectar ao servidor!');
        return false
    }
}


//-----------------------------------join---------------------------------------------------------

//funcao para ver se o player esta registado ou nao

// async function isPlayerRegistered(nick, password) {
//     try {
//         const response = await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/register', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ nick, password })
//         });

//         const data = await response.json();

//         if (response.ok) {
//             // Registro realizado com sucesso, jogador registrado com sucesso ou já estava com os mesmos dados.
//             console.log('Jogador está registrado e autenticado.');
//             return true;
//         } else if (data.error === 'User registered with a different password') {
//             // O jogador está registrado, mas com outra senha
//             console.log('Jogador já registrado com outra senha.');
//             return false;
//         } else {
//             // Outros erros, como o jogador não estar registrado
//             console.log(`Erro: ${data.error}`);
//             return false;
//         }
//     } catch (error) {
//         console.error('Erro ao verificar jogador:', error);
//         return false;
//     }
// }



async function joinGame(group, nick, password, size) {
    try {
        const response = await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ group, nick, password, size }) // Dados enviados ao servidor
        });
    
        const data = await response.json();
        console.log("isto é a data: ", data);

        if (response.ok) {
            alert(`Jogo criado! ID do jogo: ${data.game}`);
            return data.game; // Retorna o ID do jogo
        } else {
            alert(`Erro no join: ${data.error}`);
            return null; // Indica falha no join
        }
    } catch (error) {
        console.error('Erro ao entrar no jogo:', error);
        alert('Erro ao conectar ao servidor!');
        return null; // Indica falha no join
    }
}

function updatePlayers(game, nick) {
    return new Promise((resolve, reject) => {
        const url = `http://twserver.alunos.dcc.fc.up.pt:8008/update?nick=${nick}&game=${game}`;
        const eventSource = new EventSource(url);

        // Mensagem de espera até os jogadores se conectarem
        const waitingMessage = document.querySelector('.waiting-message');

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Dados recebidos:', data);

            // Verifica se há dois jogadores conectados
            if (data.players && Object.keys(data.players).length === 2) {
                const player1 = Object.keys(data.players)[0];
                const player2 = Object.keys(data.players)[1];

                // Atualiza a mensagem com os jogadores
                waitingMessage.textContent = `${player1}   vs   ${player2}`;

                // Verifica se o jogo começou (há informações de turno)
                if (data.turn) {
                    console.log('Atualização dos Jogadores: ', data);

                    // Envia os dados para resolver a promessa e mantém o EventSource aberto
                    resolve(data);
                    
                }
            } else {
                waitingMessage.textContent = 'À espera do segundo jogador...';
                console.log('À espera do segundo jogador...');
            }
        };

        // Trata erros na conexão
        eventSource.onerror = (error) => {
                console.error('Erro no EventSource:', error);
                console.log(game);
                console.log(nick);
                eventSource.close();
                setTimeout(() => {
                    updatePlayers(game, nick); // Tenta novamente
                }, 5000);
        };
    });
}



async function sendMove(nick, password, game, cell) {
    try {

        const controller = new AbortController();
        // const timeout = setTimeout(() => controller.abort(), 120000); 
        const response = await fetch('http://twserver.alunos.dcc.fc.up.pt:8008/notify', {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({nick, password, game, cell}),
        });
        const data = await response.json();

        if (!response.ok) {
            console.error('Erro ao enviar jogada:', data.error);
            alert(`Erro: ${data.error}`);
            return false;
        }

        console.log('Jogada enviada com sucesso:', data);
        return true;

    } catch (error) {
        console.error('Erro na conexão com o servidor:', error);
        return false;
    }
}



async function updateGame(gameID, nick) {
    try {
        const response = await fetch(`http://twserver.alunos.dcc.fc.up.pt:8008/update?nick=${nick}&game=${gameID}`);
        const data = await response.json();

        if (response.ok) {
            console.log("Dados do jogo recebidos do servidor:", data);
            return data;
        } else {
            console.error("Erro ao atualizar jogo:", data.error);
            return null;
        }
    } catch (error) {
        console.error("Erro ao conectar ao servidor para atualização:", error);
        return null;
    }
}