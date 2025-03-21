let selectedEvent = 0; // Variável global para armazenar o ID do evento selecionado
let userData = {}; // Variável global para armazenar os dados do usuário logado

document.addEventListener('DOMContentLoaded', async () => {
  
  let eventIds = [];
  const token = localStorage.getItem('token');

  // Verifica se o usuário está autenticado
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Seleciona o elemento para exibir mensagens
  const messageElement = document.getElementById('message');

  // Obtém os dados do usuário autenticado
  const userResponse = await fetch('http://localhost:3000/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (userResponse.ok) {
    userData = await userResponse.json();
    console.log('Dados do usuário:', userData);
    document.getElementById('link').href = `../html/userInfo.html?id=${userData.id}&name=${userData.name}`
  } else {
    messageElement.textContent = 'Erro ao obter dados do usuário.';
    return;
  }

  // Obtém os IDs dos eventos disponíveis
  try {
    const eventsResponse = await fetch('http://localhost:3000/events/ids', {
      method: 'GET',
    });

    if (!eventsResponse.ok) {
      throw new Error('Erro ao obter IDs de eventos.');
    }

    eventIds = await eventsResponse.json();
    console.log('IDs dos eventos:', eventIds);
  } catch (error) {
    console.error('Erro:', error);
    messageElement.textContent = 'Erro ao obter IDs de eventos.';
  }

  // Seleciona o elemento <main> para adicionar os cards de eventos
  const main = document.querySelector('main');
  if (!main) {
    console.error('Elemento <main> não encontrado no HTML!');
    return;
  }

  // Função para buscar e exibir os dados de um evento
  async function fetchEventData(eventId) {
    try {
      const eventResponse = await fetch(`http://localhost:3000/eventId?id=${eventId}`);
      if (!eventResponse.ok) {
        throw new Error(`Erro: ${eventResponse.statusText}`);
      }
      const eventData = await eventResponse.json();

      // Verifica se a data do evento é anterior à data atual
      const today = new Date().toISOString().split('T')[0];
      if (eventData.event_date < today) {
        console.warn(`Evento "${eventData.name}" não será adicionado, pois a data (${eventData.event_date}) é anterior à data atual.`);
        return;
      }

      // Obtém os dados do CEP
      const cepResponse = await fetch(`https://viacep.com.br/ws/${eventData.CEP}/json/`);
      if (!cepResponse.ok) {
        throw new Error(`Erro ao buscar CEP: ${cepResponse.statusText}`);
      }
      const cepData = await cepResponse.json();

      // Cria o card do evento
      const div = document.createElement('div');
      div.classList.add('eventCard');

      // Formata a data
      const data = eventData.event_date.slice(0, -14);
      const partes = data.split('-');

      // Adiciona a imagem do evento
      const imageUrl = `http://localhost:3000/eventImage/${eventId}`;

      // Adiciona o conteúdo do card
      div.innerHTML = `
        <img src="${imageUrl}" alt="Imagem do Evento" style="width: 100%; height: auto;">
        <h3>${eventData.name}</h3>
        <div class="divide">
          <p><strong>Tipo:</strong> ${eventData.event_type}</p>
          <p><strong>Participantes:</strong> ${eventData.participants}</p>
        </div>
        <div class="divide">
          <p><strong>Data:</strong> ${partes[2]}/${partes[1]}/${partes[0]}</p>
          <p><strong>Hora:</strong> ${eventData.event_time}</p>
        </div>
        <p><strong>Endereço:</strong> ${cepData.bairro}, ${cepData.localidade} - ${cepData.uf}</p>
        <button value="${eventId}" onclick="entrarCardEvento(this)">Ver Detalhes</button>
      `;

      // Adiciona o card ao <main>
      main.appendChild(div);
    } catch (error) {
      console.error(`Erro ao buscar os dados do evento ${eventId}:`, error.message);
    }
  }

  // Função para buscar e exibir todos os eventos
  async function fetchAllEvents(eventIds) {
    for (const eventId of eventIds) {
      await fetchEventData(eventId);
    }
  }

  // Exibe todos os eventos
  fetchAllEvents(eventIds);
});

// Função para entrar em um evento
async function entrarEvento() {
  const eventId = document.getElementById('userEvent').value;
  const participantId = userData.id;

  try {
    const response = await fetch('http://localhost:3000/participantsRegister', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: selectedEvent, participant_id: participantId }),
    });

    if (response.ok) {
      alert('Inscrição realizada com sucesso!');
      location.reload();
    } else {
      const errorMessage = await response.text();
      alert(`Erro: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Erro ao entrar no evento:', error);
    alert('Erro ao entrar no evento.');
  }
}

// Função para exibir os detalhes de um evento
async function entrarCardEvento(button) {
  document.getElementById('joinEventLock').style.display = 'block';
  selectedEvent = button.value;

  try {
      // Obtém os dados do evento
      const eventResponse = await fetch(`http://localhost:3000/eventId?id=${selectedEvent}`);
      if (!eventResponse.ok) {
          throw new Error(`Erro: ${eventResponse.statusText}`);
      }
      const eventData = await eventResponse.json();

      // Carrega a imagem do evento
      const imageUrl = `http://localhost:3000/eventImage/${selectedEvent}`;
      document.getElementById('eventImage').src = imageUrl;

      // Obtém os dados do CEP
      const cepResponse = await fetch(`https://viacep.com.br/ws/${eventData.CEP}/json/`);
      if (!cepResponse.ok) {
          throw new Error(`Erro ao buscar CEP: ${cepResponse.statusText}`);
      }
      const cepData = await cepResponse.json();

      // Obtém o número de participantes
      const participantsResponse = await fetch(`http://localhost:3000/participants?groupId=${selectedEvent}`);
      if (!participantsResponse.ok) {
          throw new Error(`Erro: ${participantsResponse.statusText}`);
      }
      const participantsData = await participantsResponse.json();

      // Remove todos os caracteres não numéricos e espaços do número de telefone
      const phoneNumber = eventData.phone_number.replace(/\D+/g, '').trim();

      // Exibe os detalhes do evento
      document.getElementById('preencher').textContent = eventData.name; // Nome do evento
      document.getElementById('description').textContent = eventData.description; // Descrição do evento
      document.getElementById('type').textContent = `Tipo: ${eventData.event_type}`;
      const data = eventData.event_date.slice(0, -14);
      const partes = data.split('-');
      document.getElementById('dataHora').textContent = `Data: ${partes[2]}/${partes[1]}/${partes[0]} - Hora: ${eventData.event_time.slice(0, -3)}`;
      document.getElementById('local').textContent = `Local: ${cepData.bairro}, ${cepData.localidade} - ${cepData.uf}`;
      document.getElementById('contact').href = `https://api.whatsapp.com/send?phone=55${phoneNumber}`;
      document.getElementById('participants').textContent = `Participantes: ${participantsData.participants}/${eventData.participants}`;
      document.getElementById('userEvent').value = selectedEvent;
  } catch (error) {
      console.error(`Erro ao buscar os dados do evento ${selectedEvent}:`, error.message);
  }
}

// Coleta todas as infos dos campos do home "Buscas"
function filterEventsAndGroups() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const filterDate = document.getElementById('filterDate').value;
  const filterTime = document.getElementById('filterTime').value;
  const filterParticipants = document.getElementById('filterParticipants').value;

  const eventCards = document.querySelectorAll('#eventsList .eventCard');

  eventCards.forEach(card => {
      // Extrair dados do card
      const eventName = card.querySelector('h3')?.textContent.toLowerCase() || '';
      
      // Hora do evento
      const timeElement = card.querySelectorAll('.divide')[1]?.querySelector('p:nth-child(2)');
      const eventTime = timeElement?.textContent
          .split(': ')[1]         // Pega o valor após "Hora: "
          ?.split(':').slice(0, 2).join(':') // Formato HH:mm
          || '';

      // Data do evento
      const dateElement = card.querySelectorAll('.divide')[1]?.querySelector('p:first-child');
      const [dd, mm, yyyy] = dateElement?.textContent
          .split(': ')[1]         // Pega a data após "Data: "
          ?.split('/') || [];
      const convertedDate = yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : '';

      // Participantes
      const participantsElement = card.querySelectorAll('.divide')[0]?.querySelector('p:nth-child(2)');
      const maxParticipants = parseInt(
          participantsElement?.textContent.split(': ')[1]?.replace(/\D/g, '') || 0, 
          10
      );

      // Aplicar filtros
      const matchesSearch = eventName.includes(searchInput);
      const matchesDate = !filterDate || convertedDate === filterDate;
      const matchesTime = !filterTime || eventTime === filterTime;
      const matchesParticipants = !filterParticipants || maxParticipants <= parseInt(filterParticipants, 10); // Corrigido para <=

      // Exibir/ocultar
      card.style.display = (matchesSearch && matchesDate && matchesTime && matchesParticipants) 
          ? 'block' 
          : 'none';
  });
}

// Função para fechar a janela de detalhes do evento
function fecharEvento() {
  document.getElementById('joinEventLock').style.display = 'none';
}