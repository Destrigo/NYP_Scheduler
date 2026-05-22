export const STORES = [
  { id: 1,  name: 'Bilderdijkstraat',         city: 'Amsterdam' },
  { id: 2,  name: 'Blokmakersplaats',          city: 'Amsterdam' },
  { id: 3,  name: 'Buikslotermeerplein',       city: 'Amsterdam' },
  { id: 4,  name: 'Buitenveldertselaan',       city: 'Amsterdam' },
  { id: 5,  name: 'Burg. van Leeuwenlaan',     city: 'Amsterdam' },
  { id: 6,  name: 'Dotterbloemstraat',         city: 'Amsterdam' },
  { id: 7,  name: 'Jollemanhof',               city: 'Amsterdam' },
  { id: 8,  name: 'Linnaeustraat',             city: 'Amsterdam' },
  { id: 9,  name: 'Middenmolenplein',          city: 'Amsterdam' },
  { id: 10, name: 'Molenwijk',                 city: 'Amsterdam' },
  { id: 11, name: 'Pieter Calandlaan',         city: 'Amsterdam' },
  { id: 12, name: 'Van Limburg Stirumstraat',  city: 'Amsterdam' },
  { id: 13, name: 'Vuurdoornlaan',             city: 'Amsterdam' },
  { id: 14, name: 'Deurningerstraat',          city: 'Enschede'  },
  { id: 15, name: 'Wesseler-nering',           city: 'Enschede'  },
  { id: 16, name: 'Windmolenbroeksweg',        city: 'Enschede'  },
]

export const SHIFT_ROLES = ['Manager', 'PizzaMaker', 'Rider']
export const USER_ROLES  = ['employee', 'store_manager', 'backoffice', 'superadmin']
export const CONTRACT_TYPES = ['hourly', 'fixed']

export const LABOR_WARNING_PCT = 35

export const ROLE_COLORS = {
  Manager:    { bg: 'var(--role-manager-bg)',    text: 'var(--role-manager-text)',    border: 'var(--role-manager-border)'    },
  PizzaMaker: { bg: 'var(--role-pizza-bg)',      text: 'var(--role-pizza-text)',      border: 'var(--role-pizza-border)'      },
  Rider:      { bg: 'var(--role-rider-bg)',      text: 'var(--role-rider-text)',      border: 'var(--role-rider-border)'      },
}

export const USER_ROLE_LABELS = {
  employee:      'Employee',
  store_manager: 'Store Manager',
  backoffice:    'Back Office',
  superadmin:    'Super Admin',
}
