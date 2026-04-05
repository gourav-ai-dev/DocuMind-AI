export const getAuth = () => ({
  userId: localStorage.getItem("userId"),
});

export const setAuth = (userId: string) => {
  localStorage.setItem("userId", userId);
};

export const clearAuth = () => {
  localStorage.removeItem("userId");
};