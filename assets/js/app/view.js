import {qs, $on, $delegate} from './helpers';
let instance = null;

export default class View {

  constructor() {

    if(!instance) {
      instance = this;
    } else {
      return instance;
    }

    this.fileInput = qs("#fileElem");
    this.fileList = qs("#fileList");
    this.listItems = document.createElement('ul');
    this.prefix = qs("#prefix");
    this.padding = qs("#padding");
    this.path = qs("#path");
    this.canvas = qs("#canvas");
    this.css = qs("#css");
    this.dimensions = qs("#dimensions");
    this.dropbox = qs("#dropbox");
    this.fileList.appendChild(this.listItems);

  }

  bindFileExplorer (handler) {

    $on(this.dropbox, 'click', (e)=>{
      if(this.fileInput) {
        this.fileInput.click();
      }
      e.preventDefault();
      // TODO: Analytics
    });

    $on(this.fileInput, 'change', function(){
      handler(this.files);
    });

  }

  bindDropboxImages (handler) {

    $on(this.dropbox, 'dragenter', (e)=>{
      e.stopPropagation();
      e.preventDefault();
    });

    $on(this.dropbox, 'dragover', (e)=>{
      e.stopPropagation();
      e.preventDefault();
    });

    $on(this.dropbox, 'drop', (e)=>{
      e.stopPropagation();
      e.preventDefault();

      let dt = e.dataTransfer;
      let files = dt.files;

      handler(files);

    });

  }

}
