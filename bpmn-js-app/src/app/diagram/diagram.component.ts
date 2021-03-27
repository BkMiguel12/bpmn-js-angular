import {
  AfterContentInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
  SimpleChanges,
  EventEmitter
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';

/**
 * You may include a different variant of BpmnJS:
 *
 * bpmn-viewer  - displays BPMN diagrams without the ability
 *                to navigate them
 * bpmn-modeler - bootstraps a full-fledged BPMN editor
 */
import * as BpmnJS from 'bpmn-js/dist/bpmn-modeler.production.min.js';
import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/bpmn';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';

import { from, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-diagram',
  template: `
    <div class="general-container">
      <div #ref class="diagram-container" id="js-canvas"></div>
      <div #props class="properties" id="js-properties-panel"></div>
    </div>
  `,
  styles: [
    `
      .general-container {
        height: 100%;
        display: flex;
        justify-content: space-around;
      }
      .diagram-container {
        height: 100%;
        width: 100%;
      }
      .properties {
        height: 100%;
        width: 30%;
      }
    `
  ]
})
export class DiagramComponent implements AfterContentInit, OnDestroy {
  private bpmnJS: BpmnJS ;

  @ViewChild('ref', { static: true }) private el: ElementRef;
  @ViewChild('props', { static: true }) private props: ElementRef;
  @Output() private importDone: EventEmitter<any> = new EventEmitter();

  @Input() private url: string;

  constructor(private http: HttpClient) {}

  ngAfterContentInit(): void {
    this.bpmnJS = new BpmnJS({
      // container: '#js-canvas',
      // propertiesPanel: {
      //   parent: '#js-properties-panel'
      // },
      additionalModules: [
        propertiesPanelModule,
        propertiesProviderModule
      ],
      moddleExtensions: {
        camunda: camundaModdleDescriptor
      }
    });

    this.bpmnJS.on('import.done', ({ error }) => {
      if (!error) {
        this.bpmnJS.get('canvas').zoom('fit-viewport');
      }
    });

    var eventBus = this.bpmnJS.get('eventBus');

    // you may hook into any of the following events
    var events = [
      // 'element.hover',
      // 'element.out',
      'element.click',
      // 'element.dblclick',
      // 'element.mousedown',
      // 'element.mouseup'
    ];

    events.forEach(function(event) {

      eventBus.on(event, function(e) {
        // e.element = the model element
        // e.gfx = the graphical element

        console.log(e);

        console.log(event, 'on', e.element.id);
      });
    });

    this.loadUrl('l');
    this.bpmnJS.attachTo(this.el.nativeElement);
    this.bpmnJS.get('propertiesPanel').attachTo(this.props.nativeElement);
  }

  // ngOnChanges(changes: SimpleChanges) {
  //   // re-import whenever the url changes
  //   if (changes.url) {
  //     this.loadUrl(changes.url.currentValue);
  //   }
  // }

  ngOnDestroy(): void {
    this.bpmnJS.destroy();
  }

  /**
   * Load diagram from URL and emit completion event
   */
  loadUrl(url: string) {
    this.importDiagram('l');
    // return (
    //   this.http.get(url, { responseType: 'text' }).pipe(
    //     switchMap((xml: string) => this.importDiagram(xml)),
    //     map(result => result.warnings),
    //   ).subscribe(
    //     (warnings) => {
    //       this.importDone.emit({
    //         type: 'success',
    //         warnings
    //       });
    //     },
    //     (err) => {
    //       this.importDone.emit({
    //         type: 'error',
    //         error: err
    //       });
    //     }
    //   )
    // );
  }

  /**
   * Creates a Promise to import the given XML into the current
   * BpmnJS instance, then returns it as an Observable.
   *
   * @see https://github.com/bpmn-io/bpmn-js-callbacks-to-promises#importxml
   */
   private importDiagram(xml: string): Observable<{warnings: Array<any>}> {
    var xml = '<?xml version="1.0" encoding="UTF-8"?>' + 
    '<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">' +
      '<bpmn2:process id="Process_1" isExecutable="false">' +
        '<bpmn2:startEvent id="StartEvent_1"/>' +
      '</bpmn2:process>' +
      '<bpmndi:BPMNDiagram id="BPMNDiagram_1">' +
        '<bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">' +
          '<bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">' +
            '<dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>' +
          '</bpmndi:BPMNShape>' +
        '</bpmndi:BPMNPlane>' +
      '</bpmndi:BPMNDiagram>' +
    '</bpmn2:definitions>'

    return from(this.bpmnJS.importXML(xml) as Promise<{warnings: Array<any>}>);
  }
}
