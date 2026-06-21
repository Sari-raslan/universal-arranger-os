export class LibraryManager {
  constructor() {
    this.libraries = [];
  }
  add(library) {
    this.libraries.push(library);
    return this.list();
  }
  list() {
    return [...this.libraries];
  }
  findByName(name) {
    return this.libraries.find(library => library.name === name) || null;
  }
}
