import React, { Component, ReactNode } from 'react';

interface HexagonProps {
  notify?: boolean;
  children: ReactNode;
}

class Hexagon extends Component<HexagonProps> {
  render() {
    return (
      <div>
        <div className="hexagon">
          <div className="hexagon-content">{this.props.children}</div>
        </div>
        {this.props.notify && (
          <span className="absolute right-0 top-1 -mr-1 -mt-1 flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-light opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-brand"></span>
          </span>
        )}
      </div>
    );
  }
}

export default Hexagon;
