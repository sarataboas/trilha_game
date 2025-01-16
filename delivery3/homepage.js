

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
            //console.log("AQUII TAMBºEM? ")
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

//LIda com o click no botão de Classificações 