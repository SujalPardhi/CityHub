let users = getLocalStorage('users', []);
let events = getLocalStorage('events', []);
let completedEvents = getLocalStorage('completedEvents', []);
let pendingActions = getLocalStorage('pendingActions', []);

// Utility functions
function getLocalStorage(key, defaultValue) {
    return JSON.parse(localStorage.getItem(key)) || defaultValue;
}

function setLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Check logged in
function isLoggedIn() {
    return localStorage.getItem('loggedInUser');
}

function getLoggedInUser() {
    const username = localStorage.getItem('loggedInUser');
    return users.find(u => u.username === username);
}

function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
}

// Archive completed events
function archiveCompleted() {
    const today = new Date().toISOString().slice(0, 10);
    events = events.filter(ev => {
        if (ev.date < today) {
            ev.completedDate = today;
            completedEvents.push(ev);
            users.forEach(u => {
                if (u.ownedEvents) u.ownedEvents = u.ownedEvents.filter(id => id !== ev.id);
                if (u.bookedEvents) u.bookedEvents = u.bookedEvents.filter(id => id !== ev.id);
            });
            return false;
        }
        return true;
    });
    setLocalStorage('events', events);
    setLocalStorage('completedEvents', completedEvents);
    setLocalStorage('users', users);
}

// Tab switching for login
function openTab(type) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(type).classList.add('active');
    event.target.classList.add('active');
}

// Handle registrations and logins
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split('/').pop();

    if (path === 'register-user.html') {
        document.getElementById('user-register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-user-username').value;
            const email = document.getElementById('reg-user-email').value;
            const password = document.getElementById('reg-user-password').value;
            if (users.find(u => u.username === username)) {
                alert('Username taken');
                return;
            }
            users.push({ username, email, password, type: 'user', bookedEvents: [] });
            setLocalStorage('users', users);
            alert('Registered! Login now.');
            window.location.href = 'login.html';
        });
    }

    if (path === 'register-owner.html') {
        document.getElementById('owner-register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-owner-username').value;
            const email = document.getElementById('reg-owner-email').value;
            const password = document.getElementById('reg-owner-password').value;
            const business = document.getElementById('reg-owner-business').value;
            if (users.find(u => u.username === username)) {
                alert('Username taken');
                return;
            }
            users.push({ username, email, password, type: 'owner', business, ownedEvents: [] });
            setLocalStorage('users', users);
            alert('Registered! Login now.');
            window.location.href = 'login.html';
        });
    }

    if (path === 'register-admin.html') {
        document.getElementById('admin-register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-admin-username').value;
            const email = document.getElementById('reg-admin-email').value;
            const password = document.getElementById('reg-admin-password').value;
            const passkey = document.getElementById('reg-admin-passkey').value;
            if (passkey !== 'secretAdminKey123') {
                alert('Invalid admin passkey');
                return;
            }
            if (users.find(u => u.username === username)) {
                alert('Username taken');
                return;
            }
            users.push({ username, email, password, type: 'admin' });
            setLocalStorage('users', users);
            alert('Admin registered! Login now.');
            window.location.href = 'login.html';
        });
    }

    if (path === 'login.html') {
        document.getElementById('user-login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('user-username').value;
            const password = document.getElementById('user-password').value;
            const user = users.find(u => u.username === username && u.password === password && u.type === 'user');
            if (user) {
                localStorage.setItem('loggedInUser', username);
                window.location.href = 'user-dashboard.html';
            } else {
                alert('Invalid credentials');
            }
        });

        document.getElementById('owner-login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('owner-username').value;
            const password = document.getElementById('owner-password').value;
            const user = users.find(u => u.username === username && u.password === password && (u.type === 'owner' || u.type === 'admin'));
            if (user) {
                localStorage.setItem('loggedInUser', username);
                window.location.href = user.type === 'admin' ? 'admin-dashboard.html' : 'owner-dashboard.html';
            } else {
                alert('Invalid credentials');
            }
        });
    }

    if (path === 'owner-dashboard.html') {
        if (!isLoggedIn() || getLoggedInUser().type !== 'owner') {
            window.location.href = 'login.html';
            return;
        }
        archiveCompleted();

        // Show/hide conditional fields
        const amountDiv = document.getElementById('amount-div');
        const seatsDiv = document.getElementById('seats-div');
        const editAmountDiv = document.getElementById('edit-amount-div');
        const editSeatsDiv = document.getElementById('edit-seats-div');

        document.querySelectorAll('input[name="paid"]').forEach(radio => {
            radio.addEventListener('change', () => {
                amountDiv.style.display = document.querySelector('input[name="paid"]:checked').value === 'paid' ? 'block' : 'none';
            });
        });

        document.querySelectorAll('input[name="seats"]').forEach(radio => {
            radio.addEventListener('change', () => {
                seatsDiv.style.display = document.querySelector('input[name="seats"]:checked').value === 'limited' ? 'block' : 'none';
            });
        });

        document.querySelectorAll('input[name="edit-paid"]').forEach(radio => {
            radio.addEventListener('change', () => {
                editAmountDiv.style.display = document.querySelector('input[name="edit-paid"]:checked').value === 'paid' ? 'block' : 'none';
            });
        });

        document.querySelectorAll('input[name="edit-seats"]').forEach(radio => {
            radio.addEventListener('change', () => {
                editSeatsDiv.style.display = document.querySelector('input[name="edit-seats"]:checked').value === 'limited' ? 'block' : 'none';
            });
        });

        // Handle add event
        document.getElementById('add-event-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const paidChecked = document.querySelector('input[name="paid"]:checked');
            const seatsChecked = document.querySelector('input[name="seats"]:checked');
            if (!paidChecked || !seatsChecked) {
                alert('Please select Paid/Free and Seats options.');
                return;
            }
            const name = document.getElementById('event-name').value;
            const desc = document.getElementById('desc').value;
            const date = document.getElementById('date').value;
            const venue = document.getElementById('venue').value;
            const time = document.getElementById('time').value;
            const duration = document.getElementById('duration').value;
            const contact = document.getElementById('contact').value;
            const paid = paidChecked.value;
            const amount = paid === 'paid' ? document.getElementById('amount').value : 0;
            const seats = seatsChecked.value;
            const numSeats = seats === 'limited' ? document.getElementById('num-seats').value : 0;
            const imageFile = document.getElementById('image').files[0];

            function addPendingEvent(imageData) {
                const event = {
                    id: Date.now(),
                    name,
                    desc,
                    image: imageData,
                    date,
                    venue,
                    time,
                    duration,
                    contact,
                    isPaid: paid === 'paid',
                    amount: parseFloat(amount) || 0,
                    isLimited: seats === 'limited',
                    seats: parseInt(numSeats) || 0,
                    remainingSeats: parseInt(numSeats) || Infinity,
                    owner: getLoggedInUser().username,
                    approved: false
                };
                pendingActions.push({ type: 'event', action: 'add', data: event });
                setLocalStorage('pendingActions', pendingActions);
                alert('event is go to admin for approval');
                e.target.reset();
                amountDiv.style.display = 'none';
                seatsDiv.style.display = 'none';
                loadMyUpcomingEvents();
                loadMyCompletedEvents();
            }

            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function(re) {
                    addPendingEvent(re.target.result);
                };
                reader.readAsDataURL(imageFile);
            } else {
                addPendingEvent(null);
            }
        });

        // Handle edit event
        window.showEditForm = function(id) {
            const event = events.find(ev => ev.id === id) || completedEvents.find(ev => ev.id === id);
            if (!event) return;
            document.getElementById('edit-event-name').value = event.name;
            document.getElementById('edit-desc').value = event.desc;
            document.getElementById('edit-date').value = event.date;
            document.getElementById('edit-venue').value = event.venue;
            document.getElementById('edit-time').value = event.time;
            document.getElementById('edit-duration').value = event.duration;
            document.getElementById('edit-contact').value = event.contact;
            document.querySelector(`input[name="edit-paid"][value="${event.isPaid ? 'paid' : 'free'}"]`).checked = true;
            document.getElementById('edit-amount').value = event.amount || '';
            document.querySelector(`input[name="edit-seats"][value="${event.isLimited ? 'limited' : 'unlimited'}"]`).checked = true;
            document.getElementById('edit-num-seats').value = event.seats || '';
            editAmountDiv.style.display = event.isPaid ? 'block' : 'none';
            editSeatsDiv.style.display = event.isLimited ? 'block' : 'none';
            document.getElementById('edit-section').style.display = 'block';
            document.getElementById('edit-event-form').onsubmit = function(e) {
                e.preventDefault();
                const paidChecked = document.querySelector('input[name="edit-paid"]:checked');
                const seatsChecked = document.querySelector('input[name="edit-seats"]:checked');
                if (!paidChecked || !seatsChecked) {
                    alert('Please select Paid/Free and Seats options.');
                    return;
                }
                const updatedEvent = {
                    id,
                    name: document.getElementById('edit-event-name').value,
                    desc: document.getElementById('edit-desc').value,
                    date: document.getElementById('edit-date').value,
                    venue: document.getElementById('edit-venue').value,
                    time: document.getElementById('edit-time').value,
                    duration: document.getElementById('edit-duration').value,
                    contact: document.getElementById('edit-contact').value,
                    isPaid: paidChecked.value === 'paid',
                    amount: parseFloat(document.getElementById('edit-amount').value) || 0,
                    isLimited: seatsChecked.value === 'limited',
                    seats: parseInt(document.getElementById('edit-num-seats').value) || 0,
                    remainingSeats: parseInt(document.getElementById('edit-num-seats').value) || Infinity,
                    owner: event.owner,
                    approved: event.approved
                };
                const imageFile = document.getElementById('edit-image').files[0];
                function submitEdit(imageData) {
                    updatedEvent.image = imageData || event.image;
                    pendingActions.push({ type: 'event', action: 'edit', data: updatedEvent });
                    setLocalStorage('pendingActions', pendingActions);
                    document.getElementById('edit-section').style.display = 'none';
                    alert('Edit submitted for approval');
                    loadMyUpcomingEvents();
                    loadMyCompletedEvents();
                }
                if (imageFile) {
                    const reader = new FileReader();
                    reader.onload = function(re) {
                        submitEdit(re.target.result);
                    };
                    reader.readAsDataURL(imageFile);
                } else {
                    submitEdit(null);
                }
            };
        };

        window.cancelEdit = function() {
            document.getElementById('edit-section').style.display = 'none';
        };

        window.deleteEvent = function(id, isCompleted = false) {
            if (confirm('Are you sure you want to delete this event?')) {
                pendingActions.push({ type: 'event', action: 'delete', data: { id, isCompleted } });
                setLocalStorage('pendingActions', pendingActions);
                alert('Delete request submitted for approval');
                loadMyUpcomingEvents();
                loadMyCompletedEvents();
            }
        };

        function loadMyUpcomingEvents() {
            const container = document.getElementById('my-upcoming-container');
            container.innerHTML = '';
            const owner = getLoggedInUser();
            events.filter(ev => owner.ownedEvents.includes(ev.id)).forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `
                    <h3>${ev.name}</h3>
                    <p>${ev.desc}</p>
                    ${ev.image ? `<img src="${ev.image}" alt="${ev.name}">` : ''}
                    <p>Date: ${ev.date} | Time: ${ev.time}</p>
                    <p>Venue: ${ev.venue} | Contact: ${ev.contact}</p>
                    <p>${ev.isPaid ? `Paid: ₹${ev.amount}` : 'Free'} | Seats: ${ev.isLimited ? `${ev.remainingSeats}/${ev.seats}` : 'Unlimited'}</p>
                    <button onclick="showEditForm(${ev.id})">Edit</button>
                    <button onclick="deleteEvent(${ev.id}, false)">Delete</button>
                `;
                container.appendChild(card);
            });
        }

        function loadMyCompletedEvents() {
            const container = document.getElementById('my-completed-container');
            container.innerHTML = '';
            const owner = getLoggedInUser();
            completedEvents.filter(ev => owner.ownedEvents.includes(ev.id)).forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `
                    <h3>${ev.name}</h3>
                    <p>${ev.desc}</p>
                    ${ev.image ? `<img src="${ev.image}" alt="${ev.name}">` : ''}
                    <p>Completed on: ${ev.completedDate}</p>
                    <p>Venue: ${ev.venue} | Contact: ${ev.contact}</p>
                    <button onclick="deleteEvent(${ev.id}, true)">Delete</button>
                `;
                container.appendChild(card);
            });
        }

        loadMyUpcomingEvents();
        loadMyCompletedEvents();
    }

    if (path === 'admin-dashboard.html') {
        if (!isLoggedIn() || getLoggedInUser().type !== 'admin') {
            window.location.href = 'login.html';
            return;
        }
        archiveCompleted();

        function loadPendingActions() {
            const container = document.getElementById('pending-container');
            container.innerHTML = '';
            pendingActions.forEach((action, index) => {
                const card = document.createElement('div');
                card.className = 'event-card';
                if (action.type === 'event' && action.action === 'add') {
                    const ev = action.data;
                    card.innerHTML = `
                        <h3>${ev.name}</h3>
                        <p>${ev.desc}</p>
                        ${ev.image ? `<img src="${ev.image}" alt="${ev.name}">` : ''}
                        <p>Date: ${ev.date} | Time: ${ev.time}</p>
                        <p>Venue: ${ev.venue} | Contact: ${ev.contact}</p>
                        <p>${ev.isPaid ? `Paid: ₹${ev.amount}` : 'Free'} | Seats: ${ev.isLimited ? `${ev.seats}` : 'Unlimited'}</p>
                        <p>Owner: ${ev.owner}</p>
                        <button onclick="approveAction(${index})">Approve</button>
                        <button onclick="rejectAction(${index})">Reject</button>
                    `;
                } else if (action.type === 'event' && action.action === 'edit') {
                    const ev = action.data;
                    card.innerHTML = `
                        <h3>Edit: ${ev.name}</h3>
                        <p>${ev.desc}</p>
                        ${ev.image ? `<img src="${ev.image}" alt="${ev.name}">` : ''}
                        <p>Date: ${ev.date} | Time: ${ev.time}</p>
                        <p>Venue: ${ev.venue} | Contact: ${ev.contact}</p>
                        <p>${ev.isPaid ? `Paid: ₹${ev.amount}` : 'Free'} | Seats: ${ev.isLimited ? `${ev.seats}` : 'Unlimited'}</p>
                        <p>Owner: ${ev.owner}</p>
                        <button onclick="approveAction(${index})">Approve</button>
                        <button onclick="rejectAction(${index})">Reject</button>
                    `;
                } else if (action.type === 'event' && action.action === 'delete') {
                    const { id, isCompleted } = action.data;
                    const ev = (isCompleted ? completedEvents : events).find(e => e.id === id);
                    card.innerHTML = `
                        <h3>Delete: ${ev ? ev.name : `Event ID ${id}`}</h3>
                        <p>Completed: ${isCompleted ? 'Yes' : 'No'}</p>
                        <button onclick="approveAction(${index})">Approve</button>
                        <button onclick="rejectAction(${index})">Reject</button>
                    `;
                }
                container.appendChild(card);
            });
        }

        window.approveAction = function(index) {
            const action = pendingActions[index];
            if (action.type === 'event' && action.action === 'add') {
                const ev = action.data;
                ev.approved = true;
                events.push(ev);
                const owner = users.find(u => u.username === ev.owner);
                if (owner) {
                    owner.ownedEvents = owner.ownedEvents || [];
                    owner.ownedEvents.push(ev.id);
                }
                setLocalStorage('events', events);
                setLocalStorage('users', users);
            } else if (action.type === 'event' && action.action === 'edit') {
                const ev = action.data;
                const targetArray = ev.date < new Date().toISOString().slice(0, 10) ? completedEvents : events;
                const eventIndex = targetArray.findIndex(e => e.id === ev.id);
                if (eventIndex !== -1) {
                    targetArray[eventIndex] = ev;
                } else {
                    events.push(ev);
                }
                setLocalStorage('events', events);
                setLocalStorage('completedEvents', completedEvents);
            } else if (action.type === 'event' && action.action === 'delete') {
                const { id, isCompleted } = action.data;
                const targetArray = isCompleted ? completedEvents : events;
                const eventIndex = targetArray.findIndex(e => e.id === id);
                if (eventIndex !== -1) {
                    targetArray.splice(eventIndex, 1);
                    users.forEach(u => {
                        if (u.ownedEvents) u.ownedEvents = u.ownedEvents.filter(eid => eid !== id);
                        if (u.bookedEvents) u.bookedEvents = u.bookedEvents.filter(eid => eid !== id);
                    });
                }
                setLocalStorage('events', events);
                setLocalStorage('completedEvents', completedEvents);
                setLocalStorage('users', users);
            }
            pendingActions.splice(index, 1);
            setLocalStorage('pendingActions', pendingActions);
            loadPendingActions();
            loadCurrentUpcomingEvents();
            loadCurrentCompletedEvents();
        };

        window.rejectAction = function(index) {
            pendingActions.splice(index, 1);
            setLocalStorage('pendingActions', pendingActions);
            loadPendingActions();
        };

        window.adminDeleteEvent = function(id, isCompleted) {
            if (confirm('Are you sure you want to delete this event?')) {
                const targetArray = isCompleted ? completedEvents : events;
                const eventIndex = targetArray.findIndex(e => e.id === id);
                if (eventIndex !== -1) {
                    targetArray.splice(eventIndex, 1);
                    users.forEach(u => {
                        if (u.ownedEvents) u.ownedEvents = u.ownedEvents.filter(eid => eid !== id);
                        if (u.bookedEvents) u.bookedEvents = u.bookedEvents.filter(eid => eid !== id);
                    });
                    setLocalStorage('events', events);
                    setLocalStorage('completedEvents', completedEvents);
                    setLocalStorage('users', users);
                    loadCurrentUpcomingEvents();
                    loadCurrentCompletedEvents();
                }
            }
        };

        function loadCurrentUpcomingEvents() {
            const container = document.getElementById('current-upcoming-container');
            container.innerHTML = '';
            events.forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `
                    <h3>${ev.name}</h3>
                    <p>${ev.desc}</p>
                    ${ev.image ? `<img src="${ev.image}" alt="${ev.name}">` : ''}
                    <p>Date: ${ev.date} | Time: ${ev.time}</p>
                    <p>Venue: ${ev.venue} | Contact: ${ev.contact}</p>
                    <p>${ev.isPaid ? `Paid: ₹${ev.amount}` : 'Free'} | Seats: ${ev.isLimited ? `${ev.remainingSeats}/${ev.seats}` : 'Unlimited'}</p>
                    <p>Owner: ${ev.owner}</p>
                    <button onclick="adminDeleteEvent(${ev.id}, false)">Delete</button>
                `;
                container.appendChild(card);
            });
        }

        function loadCurrentCompletedEvents() {
            const container = document.getElementById('current-completed-container');
            container.innerHTML = '';
            completedEvents.forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `
                    <h3>${ev.name}</h3>
                    <p>${ev.desc}</p>
                    ${ev.image ? `<img src="${ev.image}" alt="${ev.name}">` : ''}
                    <p>Completed on: ${ev.completedDate}</p>
                    <p>Venue: ${ev.venue} | Contact: ${ev.contact}</p>
                    <p>Owner: ${ev.owner}</p>
                    <button onclick="adminDeleteEvent(${ev.id}, true)">Delete</button>
                `;
                container.appendChild(card);
            });
        }

        loadPendingActions();
        loadCurrentUpcomingEvents();
        loadCurrentCompletedEvents();
    }

    if (path === 'user-dashboard.html') {
        if (!isLoggedIn() || getLoggedInUser().type !== 'user') {
            window.location.href = 'login.html';
            return;
        }
        archiveCompleted();

        function loadBookedUpcoming() {
            const container = document.getElementById('booked-upcoming-container');
            container.innerHTML = '';
            const user = getLoggedInUser();
            events.filter(ev => user.bookedEvents.includes(ev.id)).forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `
                    <h3>${ev.name}</h3>
                    <p>${ev.desc}</p>
                    ${ev.image ? `<img src="${ev.image}" alt="${ev.name}">` : ''}
                    <p>Date: ${ev.date} | Time: ${ev.time}</p>
                    <p>Venue: ${ev.venue}</p>
                `;
                container.appendChild(card);
            });
        }

        function loadBookedCompleted() {
            const container = document.getElementById('booked-completed-container');
            container.innerHTML = '';
            const user = getLoggedInUser();
            completedEvents.filter(ev => user.bookedEvents.includes(ev.id)).forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.innerHTML = `
                    <h3>${ev.name}</h3>
                    <p>${ev.desc}</p>
                    ${ev.image ? `<img src="${ev.image}" alt="${ev.name}">` : ''}
                    <p>Completed on: ${ev.completedDate}</p>
                    <p>Venue: ${ev.venue}</p>
                `;
                container.appendChild(card);
            });
        }

        loadBookedUpcoming();
        loadBookedCompleted();
    }

    if (path === 'index.html') {
        archiveCompleted();

        function loadUpcomingEvents() {
            const container = document.getElementById('upcoming-events-container');
            container.innerHTML = '';
            events.filter(ev => ev.approved).forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.dataset.id = ev.id;
                card.onclick = showModal;
                card.innerHTML = `
                    <h3>${ev.name}</h3>
                    <p>${ev.desc}</p>
                    ${ev.image ? `<img src="${ev.image}" alt="${ev.name}">` : ''}
                    <p>Date: ${ev.date}</p>
                `;
                container.appendChild(card);
            });
        }

        function loadCompletedEvents() {
            const container = document.getElementById('completed-events-container');
            container.innerHTML = '';
            completedEvents.filter(ev => ev.approved).forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                card.dataset.id = ev.id;
                card.onclick = showModal;
                card.innerHTML = `
                    <h3>${ev.name}</h3>
                    <p>${ev.desc}</p>
                    ${ev.image ? `<img src="${ev.image}" alt="${ev.name}">` : ''}
                    <p>Completed on: ${ev.completedDate}</p>
                `;
                container.appendChild(card);
            });
        }

        function bookEvent(eventId) {
            const ev = events.find(e => e.id === eventId);
            if (!ev) return;
            const user = getLoggedInUser();
            if (user.bookedEvents.includes(eventId)) {
                alert('Already booked');
                return;
            }
            if (ev.isLimited && ev.remainingSeats <= 0) {
                alert('No seats left');
                return;
            }
            if (ev.isPaid) {
                if (!confirm(`Pay ₹${ev.amount} for ${ev.name}?`)) {
                    return;
                }
                alert('Payment successful!');
            }
            user.bookedEvents.push(eventId);
            if (ev.isLimited) ev.remainingSeats--;
            setLocalStorage('users', users);
            setLocalStorage('events', events);
            alert('Booked!');
            loadUpcomingEvents();
        }

        loadUpcomingEvents();
        loadCompletedEvents();
    }
});