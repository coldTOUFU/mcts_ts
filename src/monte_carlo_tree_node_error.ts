class BaseError extends Error {
  constructor(e?: string) {
    super(e);
    this.name = new.target.name;
  }
}

export class NoChildrenError extends BaseError {}

export class NoActionsAllowedError extends BaseError {}

