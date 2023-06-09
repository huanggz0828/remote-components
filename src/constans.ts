export const DEFAULT_JS = `import React, { useState } from 'react';

export default function MyApp() {
  return (
    <div>
      <h1>Counters that update separately</h1>
      <MyButton />
      <MyButton />
    </div>
  );
}

function MyButton() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <button onClick={handleClick}>
      Clicked {count} times
    </button>
  );
}
`

export const DEFAULT_LESS = `h1 {
    font-size: 3.2em;
    line-height: 1.1;
  }
  
  button {
    color: #213547;
    background-color: #ffffff;
    border-radius: 8px;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.25s;
    margin-right: 5px;
    &:hover {
      border-color: #646cff;
    }
  }`