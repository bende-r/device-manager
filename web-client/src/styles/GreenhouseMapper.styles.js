import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
`;

export const ContextMenu = styled.div`
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
`;

export const ContextMenuItem = styled.div`
  padding: 8px 16px;
  cursor: pointer;
  &:hover {
    background-color: #f5f5f5;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;

  button {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;

    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #e0e0e0;
    }

    &.active {
      background-color: #4caf50;
      color: white;
    }
  }
`;

export const ScaleControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const SaveStatus = styled.div`
  margin-left: auto;
  font-size: 0.9em;
  color: #666;
  padding: 0 10px;
`;

export const CanvasContainer = styled.div`
  border: 1px solid #ccc;
  overflow: hidden;
  flex-grow: 1;
  position: relative;
`;

export const Canvas = styled.canvas`
  transform-origin: 0 0;
  background-color: #f9f9f9;
  cursor: crosshair;
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const Modal = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;

  label {
    display: block;
    margin-bottom: 15px;

    input {
      width: 100%;
      padding: 8px;
      margin-top: 5px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  }
`;

export const ValidationError = styled.div`
  color: #f44336;
  font-size: 0.8em;
  margin-top: 5px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

export const ListsContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
`;

export const BedsList = styled.div`
  flex: 1;
  border: 1px solid #eee;
  padding: 15px;
  max-height: 200px;
  overflow-y: auto;

  h3 {
    margin-top: 0;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
`;

export const BedItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;

  &.selected {
    background-color: #e8f5e9;
  }

  &:hover {
    background-color: #f1f8e9;
  }

  div {
    display: flex;
    gap: 8px;
  }

  button {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;

    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #e0e0e0;
    }
  }
`;

export const DevicesList = styled.div`
  flex: 1;
  border: 1px solid #eee;
  padding: 15px;
  max-height: 200px;
  overflow-y: auto;

  h3 {
    margin-top: 0;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
`;

export const DeviceItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;

  > div:first-child {
    flex-grow: 1;
  }

  > div:last-child {
    display: flex;
    gap: 8px;
  }

  button {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;

    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #e0e0e0;
    }
  }
`;

export const DeviceLink = styled.span`
  color: #2196f3;
  cursor: pointer;
  margin-left: 5px;
  font-size: 0.9em;

  &:hover {
    text-decoration: underline;
  }
`;
