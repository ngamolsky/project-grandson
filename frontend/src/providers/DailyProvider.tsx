import { DailyProvider, useCallObject } from '@daily-co/daily-react';
import { useEffect } from 'react';

function Provider(props: { url: string; children: React.ReactNode }) {
  const { url, children } = props;
  const callObject = useCallObject({});

  useEffect(() => {
    callObject?.join({
      url,
      startVideoOff: true,
    });
  }, [callObject, url]);

  if (!callObject) {
    return null;
  }

  return <DailyProvider callObject={callObject}>{children}</DailyProvider>;
}

export { Provider as DailyProvider };
