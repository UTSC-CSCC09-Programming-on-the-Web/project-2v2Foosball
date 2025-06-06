# Next Cup

### Team Members:
| Name          | Email                         | UTORID      | 
| ------------- | ------------------------------| ----------- |
| Yong Le He    | yongle.he@mail.utoronto.ca    |  heyong4    |
| Aydin Parekh  | aydin.parekh@mail.utoronto.ca |  parekhay   |
| Emin Guliyev  | emin.guliyev@mail.utoronto.ca |  guliyeve   |

## Brief Description:
Toronto is home to many amazing local cafes with many dedicated Canadian speciality coffee roasters. Our team aims to develop a centralized web-app for coffee enthusiasts to discover and support quality cafes across the city and roasters across Canada, while personalizing their coffee experience to their own taste. When a user reviews their coffee, our sentimental analysis system will give suggestions for what cafe/beans to try next based on a variety of factors (flavour, price, method of extraction etc.).

### Modern Framework of Choice:
Angular

### Additional Requirement of Choice:
Task queues - As our algorithm is continuously being updated and evolving, simultaneous feedback given by users will be processed asynchronously, which will allow users with similar taste profiles to improve each others next cup.

### Alpha:
- Cafe/roaster catalogue
- Favourite cafe/roaster list
- Filter through different types of coffee shops, beans, locations etc. based on their features or strengths
- Database models and setup
- Login, sign up and payment


### Beta:
- User ratings (text + numeric score) -> sentimental analysis and personalization
- Coffee recommendations (cafe/beans) and experimentation (ie. suggesting coffee outside of their profile they still might like)
- Brewing guide relative to taste profile & image analysis for grind size
- A list of well-discussed expert/world brewing champion techniques to use as a baseline
- Hardware integration and step-by-step technique walkthrough (for pourover) 


### Final Version:
- All of the above completed (more complex features in the beta may need more time to develop)
- Edge cases, security and testing
- Responsive and modern UI
- Docker & deployment