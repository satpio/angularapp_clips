import { Component, AfterContentInit, ContentChildren, QueryList } from '@angular/core';
import { TabComponent } from '../tab/tab.component';

@Component({
  selector: 'app-tabs-container',
  templateUrl: './tabs-container.component.html',
  styleUrls: ['./tabs-container.component.css']
})
export class TabsContainerComponent implements AfterContentInit {

  @ContentChildren(TabComponent) tabs: QueryList<TabComponent> = new QueryList();

  constructor() { }

  ngAfterContentInit(): void {
    const activeTabs = this.tabs?.filter(tab => tab.active);
    if (!activeTabs || activeTabs.length === 0) {
      this.selectTab(null, this.tabs!.first);
    }
  }

  selectTab(
    $event: Event | null,
    tab: TabComponent
  ) {
    $event && $event.preventDefault();
    this.tabs?.forEach(tab => tab.active = false);
    tab.active = true;
  }

  toggleTabNavClass(tab: TabComponent) {
    return {
      'hover:text-indigo-400': !tab.active,
      'hover:text-white text-white bg-indigo-400': tab.active
    }
  }

}
