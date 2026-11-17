import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';

interface Props {
  children: ReactNode;
  /** Changing this value clears a previous error (e.g. pass the pathname). */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/** Catches render errors so one broken screen does not blank the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Box role="alert" sx={{ textAlign: 'center', py: 8 }}>
        <Typography level="h3">Something went wrong</Typography>
        <Typography level="body-sm" sx={{ my: 1 }}>{this.state.error.message}</Typography>
        <Button onClick={() => this.setState({ error: null })}>Try again</Button>
      </Box>
    );
  }
}
