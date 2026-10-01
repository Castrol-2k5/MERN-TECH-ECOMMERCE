import RegisterForm from '../../features/auth/components/RegisterForm.jsx';

export const RegisterPage = () => {
  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
