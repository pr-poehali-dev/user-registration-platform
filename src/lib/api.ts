const AUTH_URL = 'https://functions.poehali.dev/6f63ff4c-e75c-4445-8069-f1eb1c68b1e7';
const PEOPLE_URL = 'https://functions.poehali.dev/7236e84d-0198-401d-8df0-4b14f09dcb09';
const TABLES_URL = 'https://functions.poehali.dev/bcae6930-d622-4398-bd84-c2d23a28ecd0';

function getToken() {
  return localStorage.getItem('token') || '';
}

export const api = {
  auth: {
    register: (login: string, password: string) =>
      fetch(AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', login, password }) }).then(r => r.json()),
    login: (login: string, password: string) =>
      fetch(AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', login, password }) }).then(r => r.json()),
    check: (token: string) =>
      fetch(AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check', token }) }).then(r => r.json()),
  },
  people: {
    list: () =>
      fetch(PEOPLE_URL, { method: 'GET', headers: { 'X-Auth-Token': getToken() } }).then(r => r.json()),
    add: (full_name: string, photo_data?: string) =>
      fetch(PEOPLE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() }, body: JSON.stringify({ full_name, photo_data }) }).then(r => r.json()),
    delete: (id: number) =>
      fetch(PEOPLE_URL, { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() }, body: JSON.stringify({ id }) }).then(r => r.json()),
  },
  tables: {
    list: () =>
      fetch(TABLES_URL, { method: 'GET', headers: { 'X-Auth-Token': getToken() } }).then(r => r.json()),
    create: (name: string, data: object) =>
      fetch(TABLES_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() }, body: JSON.stringify({ name, data }) }).then(r => r.json()),
    update: (id: number, name: string, data: object) =>
      fetch(TABLES_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() }, body: JSON.stringify({ id, name, data }) }).then(r => r.json()),
  },
};