'use client'
import { Component, ReactNode } from 'react'

interface Props {
  fallback?: ReactNode
  children: ReactNode
}
interface State { hasError: boolean }

export class ThreeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="w-full h-full bg-gradient-to-br from-ast-dark to-ast-primary rounded-2xl" aria-hidden="true" />
      )
    }
    return this.props.children
  }
}
