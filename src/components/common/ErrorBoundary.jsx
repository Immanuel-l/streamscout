import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
          <div className="text-center max-w-md space-y-4">
            <svg className="w-16 h-16 mx-auto text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h1 className="text-2xl font-display text-white">Etwas ist schiefgelaufen</h1>
            <p className="text-surface-400 text-sm">
              Ein unerwarteter Fehler ist aufgetreten. Versuch die Seite neu zu laden.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-lg bg-surface-800 text-surface-200 text-sm font-medium hover:bg-surface-700 transition-colors"
              >
                Erneut versuchen
              </button>
              <button
                onClick={() => { this.handleReset(); window.location.href = '/' }}
                className="px-5 py-2.5 rounded-lg bg-accent-500 text-black text-sm font-medium hover:bg-accent-400 transition-colors"
              >
                Zur Startseite
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
