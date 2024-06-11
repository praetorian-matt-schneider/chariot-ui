import React, { Component, ReactNode } from 'react';

interface HexagonProps {
  children: ReactNode;
}

class Hexagon extends Component<HexagonProps> {
  render() {
    return (
      <div className="hexagon">
        <div className="hexagon-content">{this.props.children}</div>
      </div>
    );
  }
}

export default Hexagon;
