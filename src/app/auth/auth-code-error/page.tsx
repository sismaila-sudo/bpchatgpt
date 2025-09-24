export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Erreur d'authentification
        </h1>
        <p className="text-gray-600 mb-4">
          Une erreur s'est produite lors de la connexion.
        </p>
        <a
          href="/"
          className="text-blue-600 hover:underline"
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  )
}