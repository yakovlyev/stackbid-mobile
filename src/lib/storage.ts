import AsyncStorage from '@react-native-async-storage/async-storage';

// Те же ключи и та же логика, что в localStorage на вебе (sb_user_email и т.д.),
// чтобы поведение гейта/пейволла было одинаковым на обеих платформах.
const KEYS = {
  email: 'sb_user_email',
  name: 'sb_user_name',
  role: 'sb_user_role',
};

export async function getStoredEmail(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.email);
}

export async function saveUser(email: string, name: string, role: string) {
  await AsyncStorage.setMany({
    [KEYS.email]: email,
    [KEYS.name]: name,
    [KEYS.role]: role,
  });
}

export async function getStoredUser() {
  const values = await AsyncStorage.getMany([KEYS.email, KEYS.name, KEYS.role]);
  return {
    email: values[KEYS.email] || '',
    name: values[KEYS.name] || '',
    role: values[KEYS.role] || 'homeowner',
  };
}
